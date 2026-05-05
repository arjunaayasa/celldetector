from functools import lru_cache
from math import pi
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import torch
from cellpose import models
from PIL import Image, UnidentifiedImageError


LABEL_COLORS_BGR = {
    "normal": (76, 175, 80),
    "abnormal": (66, 84, 220),
    "uncertain": (0, 170, 245),
}


@lru_cache(maxsize=2)
def get_cellpose_model(use_gpu: bool) -> models.Cellpose:
    if not use_gpu:
        # Some Linux CPU environments fail in oneDNN (mkldnn) with
        # "could not create a primitive" during Cellpose/Torch inference.
        torch.backends.mkldnn.enabled = False

    return models.Cellpose(gpu=use_gpu, model_type="cyto")


def classify_cell(circularity: float, aspect_ratio: float, solidity: float) -> str:
    if (
        circularity >= 0.72
        and 0.70 <= aspect_ratio <= 1.40
        and solidity >= 0.86
    ):
        return "normal"

    if circularity < 0.55 or aspect_ratio < 0.55 or aspect_ratio > 1.85 or solidity < 0.75:
        return "abnormal"

    return "uncertain"


def round_metric(value: float, digits: int = 3) -> float:
    if not np.isfinite(value):
        return 0.0
    return round(float(value), digits)


def load_rgb_image(image_path: Path) -> np.ndarray:
    try:
        with Image.open(image_path) as image:
            return np.array(image.convert("RGB"))
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("File upload tidak bisa dibaca sebagai gambar valid.") from exc


def run_cellpose(rgb_image: np.ndarray, use_gpu: bool) -> np.ndarray:
    try:
        model = get_cellpose_model(use_gpu)
        masks, _, _, _ = model.eval(
            rgb_image,
            diameter=None,
            channels=[0, 0],
        )
    except Exception as exc:
        raise RuntimeError(f"Segmentasi Cellpose gagal: {exc}") from exc

    if isinstance(masks, list):
        masks = masks[0]

    return np.asarray(masks)


def calculate_summary(cells: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(cells)
    normal = sum(1 for cell in cells if cell["label"] == "normal")
    abnormal = sum(1 for cell in cells if cell["label"] == "abnormal")
    uncertain = sum(1 for cell in cells if cell["label"] == "uncertain")

    def pct(count: int) -> float:
        return round((count / total) * 100, 2) if total else 0.0

    return {
        "total": total,
        "normal": normal,
        "abnormal": abnormal,
        "uncertain": uncertain,
        "normal_percentage": pct(normal),
        "abnormal_percentage": pct(abnormal),
        "uncertain_percentage": pct(uncertain),
    }


def analyze_image(
    image_path: Path,
    result_path: Path,
    use_gpu: bool = False,
) -> dict[str, Any]:
    rgb_image = load_rgb_image(image_path)
    masks = run_cellpose(rgb_image, use_gpu)
    marked_bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

    cells: list[dict[str, Any]] = []
    object_ids = [int(obj_id) for obj_id in np.unique(masks) if int(obj_id) != 0]

    for object_id in object_ids:
        binary_mask = (masks == object_id).astype(np.uint8)
        contours, _ = cv2.findContours(
            binary_mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )
        if not contours:
            continue

        contour = max(contours, key=cv2.contourArea)
        area = float(cv2.contourArea(contour))
        if area < 30:
            continue

        perimeter = float(cv2.arcLength(contour, True))
        if perimeter <= 0:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        aspect_ratio = float(w / h) if h else 0.0
        circularity = float((4 * pi * area) / (perimeter * perimeter))

        hull = cv2.convexHull(contour)
        convex_area = float(cv2.contourArea(hull))
        solidity = float(area / convex_area) if convex_area > 0 else 0.0

        label = classify_cell(circularity, aspect_ratio, solidity)
        color = LABEL_COLORS_BGR[label]

        cv2.drawContours(marked_bgr, [contour], -1, color, 2, cv2.LINE_AA)

        cells.append(
            {
                "cell_id": len(cells) + 1,
                "label": label,
                "score": round_metric(circularity, 3),
                "metrics": {
                    "area": round_metric(area, 2),
                    "perimeter": round_metric(perimeter, 2),
                    "circularity": round_metric(circularity, 3),
                    "aspect_ratio": round_metric(aspect_ratio, 3),
                    "solidity": round_metric(solidity, 3),
                },
                "bbox": {
                    "x": int(x),
                    "y": int(y),
                    "w": int(w),
                    "h": int(h),
                },
            }
        )

    saved = cv2.imwrite(str(result_path), marked_bgr)
    if not saved:
        raise RuntimeError("Gagal menyimpan gambar hasil marker.")

    return {
        "summary": calculate_summary(cells),
        "cells": cells,
    }
