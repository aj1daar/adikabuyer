package com.adikabuyer.catalog.media;

import jakarta.annotation.PostConstruct;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;

@Service
public class S3StorageService {

    private static final int MAX_DIMENSION = 1600;
    private static final double JPEG_QUALITY = 0.82;

    private final S3Client s3Client;
    private final String bucket;
    private final String publicUrlBase;

    public S3StorageService(
            S3Client s3Client,
            @Value("${app.s3.bucket}") String bucket,
            @Value("${app.s3.public-url-base}") String publicUrlBase
    ) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.publicUrlBase = publicUrlBase;
    }

    @PostConstruct
    public void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            s3Client.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(bucket)
                    .policy(publicReadPolicy())
                    .build());
        }
    }

    private String publicReadPolicy() {
        return """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": "*",
                      "Action": "s3:GetObject",
                      "Resource": "arn:aws:s3:::%s/*"
                    }
                  ]
                }
                """.formatted(bucket);
    }

    public String uploadFile(MultipartFile file) {
        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new StorageException("Failed to read uploaded file", e);
        }

        // Trust the file's own magic bytes, never the client-supplied content type.
        // Anything that isn't a recognised raster image (SVG, HTML, scripts, ...) is
        // rejected here so it can never be stored and served from the public bucket.
        String verifiedContentType = detectImageContentType(originalBytes);
        if (verifiedContentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Uploaded file is not a supported image (JPEG, PNG, GIF or WebP)");
        }

        String sanitizedName = sanitizeFilename(file.getOriginalFilename());
        UploadPayload payload = prepareUpload(originalBytes, verifiedContentType, sanitizedName);

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(payload.key())
                        .contentType(payload.contentType())
                        .build(),
                RequestBody.fromBytes(payload.bytes())
        );

        return publicUrlBase + "/" + payload.key();
    }

    private record UploadPayload(String key, String contentType, byte[] bytes) {
    }

    private UploadPayload prepareUpload(byte[] originalBytes, String contentType, String sanitizedName) {
        BufferedImage image = readImage(originalBytes);

        if (image == null || (image.getWidth() <= MAX_DIMENSION && image.getHeight() <= MAX_DIMENSION)) {
            return new UploadPayload(UUID.randomUUID() + "-" + sanitizedName, contentType, originalBytes);
        }

        byte[] resizedBytes = resize(image);
        String key = UUID.randomUUID() + "-" + stripExtension(sanitizedName) + ".jpg";
        return new UploadPayload(key, "image/jpeg", resizedBytes);
    }

    private BufferedImage readImage(byte[] bytes) {
        try {
            return ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (IOException e) {
            return null;
        }
    }

    private byte[] resize(BufferedImage image) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Thumbnails.of(image)
                    .size(MAX_DIMENSION, MAX_DIMENSION)
                    .outputFormat("jpg")
                    .outputQuality(JPEG_QUALITY)
                    .toOutputStream(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new StorageException("Failed to resize uploaded image", e);
        }
    }

    private String stripExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    /**
     * Returns the canonical content type inferred from the file's leading bytes, or
     * {@code null} if the bytes are not a recognised raster image. Deliberately does not
     * decode the image (WebP has no built-in {@code ImageIO} reader) — a magic-byte match
     * is enough to keep SVG/HTML/script payloads out of the bucket.
     */
    private String detectImageContentType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == '\r' && b[5] == '\n' && b[6] == 0x1A && b[7] == '\n') {
            return "image/png";
        }
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8'
                && (b[4] == '7' || b[4] == '9') && b[5] == 'a') {
            return "image/gif";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }
        return filename
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("\\.{2,}", "_");
    }
}
