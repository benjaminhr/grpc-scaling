const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { performance } = require("perf_hooks");
const multiplyMatrixBlock = require("./multiplyMatrixBlock");
const utils = require("../utils/tools");
const app = express();

app.use(cors());
app.use(fileUpload());

/*
  GET / endpoint
  Serves the homepage client
*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

/*
  POST /multiply endpoint
  Expects two files two be uploaded
*/
app.post("/multiply", async (req, res) => {
  // Error handling for when no files where uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "Request is missing files A and B" });
  }

  // Error for when there are files but they are not named correctly in request body
  if (!req.files.hasOwnProperty("A")) {
    return res.status(400).json({ error: 'Request is missing file "A"' });
  }

  // Error for when there are files but they are not named correctly in request body
  if (!req.files.hasOwnProperty("B")) {
    return res.status(400).json({ error: 'Request is missing file "B"' });
  }

  const deadline = parseInt(req.body.deadline); // default 50

  const fileA = req.files.A.data.toString().trim();
  const fileB = req.files.B.data.toString().trim();

  const matrixA = utils.textToMatrix(fileA);
  const matrixB = utils.textToMatrix(fileB);

  const dimension = matrixA.length;

  // Error handling for when matrices do not have the same dimensions
  if (matrixA.length !== matrixB.length) {
    return res
      .status(400)
      .json({ error: "Matrices do not have the same dimensions" });
  }

  // Error handling for when the matrices do not have dimensions which are powers of 2
  if (!utils.powerOfTwo(dimension)) {
    return res.status(400).json({
      error: "Matrix dimensions must be powers of 2 e.g. 2x2, 4x4, 8x8",
    });
  }

  try {
    const p1 = performance.now();
    const resultingMatrix = await multiplyMatrixBlock(
      matrixA,
      matrixB,
      deadline
    );
    const p2 = performance.now();
    const totalTimeTaken = (p2 - p1) / 1000;

    console.log(
      "Returning matrix of size: " +
        resultingMatrix[0].length +
        " in " +
        totalTimeTaken.toFixed(4) +
        " seconds with deadline: " +
        deadline
    );
    res.json(resultingMatrix).status(200);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("REST API running on " + port);
});
