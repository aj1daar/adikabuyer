package com.adikabuyer.catalog.media;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    // Fast pre-check on the declared type. The real guarantee is S3StorageService,
    // which validates the actual file bytes — the declared content type is
    // attacker-controlled and e.g. "image/svg+xml" would otherwise be a stored-XSS vector.
    private static final Set<String> ACCEPTED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/gif", "image/webp");

    private final S3StorageService s3StorageService;

    @PostMapping("/upload")
    public MediaUploadResponse upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ACCEPTED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, GIF or WebP images are supported");
        }

        return new MediaUploadResponse(s3StorageService.uploadFile(file));
    }
}
