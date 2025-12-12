const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.BUCKET_NAME || "m-s3-firmado";

const s3 = new S3Client({ region: REGION });

app.get("/presigned", async (req, res) => {
  try {
    const filename = req.query.filename || `${Date.now()}.jpg`;
    const contentType = req.query.contentType || "application/octet-stream";
    const key = `uploads/${filename}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 60 * 10 }
    );

    res.json({
      url,
      key,
      bucket: BUCKET_NAME,
      publicUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
    });
  } catch (err) {
    console.error("Error creating presigned URL", err);
    res.status(500).json({ error: "Error creating presigned URL" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server corriendo en http://localhost:${port}`)
);