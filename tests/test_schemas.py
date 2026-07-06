from insightledger.schemas import BBox


def test_bbox_iou_identity():
    b = BBox(x0=0.1, y0=0.1, x1=0.5, y1=0.5)
    assert abs(b.iou(b) - 1.0) < 1e-9


def test_bbox_iou_disjoint():
    a = BBox(x0=0, y0=0, x1=0.2, y1=0.2)
    b = BBox(x0=0.5, y0=0.5, x1=0.7, y1=0.7)
    assert a.iou(b) == 0.0


def test_bbox_iou_partial():
    a = BBox(x0=0, y0=0, x1=0.4, y1=0.4)     # area 0.16
    b = BBox(x0=0.2, y0=0.2, x1=0.6, y1=0.6)  # area 0.16, overlap 0.2*0.2=0.04
    assert abs(a.iou(b) - (0.04 / (0.16 + 0.16 - 0.04))) < 1e-9
