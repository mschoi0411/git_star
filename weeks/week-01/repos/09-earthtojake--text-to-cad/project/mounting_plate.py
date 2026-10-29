from cadgen import build123d as bd
from cadgen import step, stl

WIDTH = 40.0
DEPTH = 30.0
THICKNESS = 4.0
HOLE_DIAMETER = 3.0
EDGE_OFFSET = 5.0


@stl(out="../artifacts/mounting_plate.stl")
@step(out="../artifacts/mounting_plate.step")
def mounting_plate():
    body = bd.Box(
        WIDTH,
        DEPTH,
        THICKNESS,
        align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN),
    )
    x_offset = WIDTH / 2 - EDGE_OFFSET
    y_offset = DEPTH / 2 - EDGE_OFFSET
    for x in (-x_offset, x_offset):
        for y in (-y_offset, y_offset):
            hole = bd.Cylinder(
                HOLE_DIAMETER / 2,
                THICKNESS,
                align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN),
            ).moved(bd.Location((x, y, 0)))
            body = body - hole
    body.label = "mounting_plate"
    return body


if __name__ == "__main__":
    mounting_plate()