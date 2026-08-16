package com.adikabuyer.catalog.media;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3StorageService {

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
        String key = UUID.randomUUID() + "-" + sanitizeFilename(file.getOriginalFilename());

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new StorageException("Failed to read uploaded file", e);
        }

        return publicUrlBase + "/" + key;
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
