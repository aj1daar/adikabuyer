package com.adikabuyer.catalog.media;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketResponse;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class S3StorageServiceTest {

    @Mock
    private S3Client s3Client;

    private S3StorageService s3StorageService;

    @BeforeEach
    void setUp() {
        s3StorageService = new S3StorageService(s3Client, "adikabuyer-media", "http://localhost:9000/adikabuyer-media");
    }

    @Test
    void uploadFile_returnsPublicUrlContainingBucketBaseAndGeneratedKey() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        String url = s3StorageService.uploadFile(file);

        assertThat(url).startsWith("http://localhost:9000/adikabuyer-media/");
        assertThat(url).endsWith("-photo.png");
    }

    @Test
    void uploadFile_sendsContentTypeAndBucketToS3() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        s3StorageService.uploadFile(file);

        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));

        PutObjectRequest request = requestCaptor.getValue();
        assertThat(request.bucket()).isEqualTo("adikabuyer-media");
        assertThat(request.contentType()).isEqualTo("image/png");
    }

    @Test
    void uploadFile_sanitizesHostileFilename() {
        MockMultipartFile file = new MockMultipartFile("file", "../../etc/passwd; rm -rf.png", "image/png", "content".getBytes());

        String url = s3StorageService.uploadFile(file);

        assertThat(url).doesNotContain("..").doesNotContain("/etc/").doesNotContain(" ").doesNotContain(";");
    }

    @Test
    void uploadFile_usesFallbackName_whenOriginalFilenameIsNull() {
        MockMultipartFile file = new MockMultipartFile("file", null, "image/png", "content".getBytes());

        String url = s3StorageService.uploadFile(file);

        assertThat(url).endsWith("-file");
    }

    @Test
    void uploadFile_throwsStorageException_whenReadingUploadedFileFails() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("photo.png");
        when(file.getInputStream()).thenThrow(new IOException("disk error"));

        assertThatThrownBy(() -> s3StorageService.uploadFile(file))
                .isInstanceOf(StorageException.class);
    }

    @Test
    void ensureBucketExists_doesNotCreateBucket_whenItAlreadyExists() {
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenReturn(HeadBucketResponse.builder().build());

        s3StorageService.ensureBucketExists();

        verify(s3Client, never()).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    void ensureBucketExists_createsBucket_whenMissing() {
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenThrow(NoSuchBucketException.builder().build());

        s3StorageService.ensureBucketExists();

        verify(s3Client).createBucket(any(CreateBucketRequest.class));
    }

    @Test
    void ensureBucketExists_appliesPublicReadPolicy_whenBucketIsCreated() {
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenThrow(NoSuchBucketException.builder().build());

        s3StorageService.ensureBucketExists();

        ArgumentCaptor<PutBucketPolicyRequest> policyCaptor = ArgumentCaptor.forClass(PutBucketPolicyRequest.class);
        verify(s3Client).putBucketPolicy(policyCaptor.capture());
        assertThat(policyCaptor.getValue().policy()).contains("s3:GetObject").contains("adikabuyer-media");
    }

    @Test
    void ensureBucketExists_doesNotApplyPolicy_whenBucketAlreadyExists() {
        when(s3Client.headBucket(any(HeadBucketRequest.class))).thenReturn(HeadBucketResponse.builder().build());

        s3StorageService.ensureBucketExists();

        verify(s3Client, never()).putBucketPolicy(any(PutBucketPolicyRequest.class));
    }
}
