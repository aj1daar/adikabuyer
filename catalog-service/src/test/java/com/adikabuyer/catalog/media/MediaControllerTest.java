package com.adikabuyer.catalog.media;

import com.adikabuyer.catalog.security.JsonAccessDeniedHandler;
import com.adikabuyer.catalog.security.JsonAuthenticationEntryPoint;
import com.adikabuyer.catalog.security.JwtUtil;
import com.adikabuyer.catalog.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MediaController.class)
@Import({SecurityConfig.class, JwtUtil.class, JsonAuthenticationEntryPoint.class, JsonAccessDeniedHandler.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-that-is-at-least-32-bytes-long",
        "app.jwt.expiration-ms=3600000"
})
class MediaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockitoBean
    private S3StorageService s3StorageService;

    private String adminToken() {
        return jwtUtil.generateToken("admin", "ADMIN");
    }

    @Test
    void upload_returns200WithUrl_whenValidAdminTokenAndImageProvided() throws Exception {
        when(s3StorageService.uploadFile(any())).thenReturn("http://localhost:9000/adikabuyer-media/abc-photo.png");

        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://localhost:9000/adikabuyer-media/abc-photo.png"));
    }

    @Test
    void upload_returns401_whenNoTokenProvided() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void upload_returns403_whenTokenIsNotAdminRole() throws Exception {
        String staffToken = jwtUtil.generateToken("staff", "STAFF");
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void upload_returns400_whenFileIsEmpty() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "photo.png", "image/png", new byte[0]);

        mockMvc.perform(multipart("/api/media/upload").file(emptyFile).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void upload_returns400_whenContentTypeIsNotAnImage() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "script.js", "application/javascript", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void upload_returns400_whenContentTypeIsSvg() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "x.svg", "image/svg+xml", "<svg xmlns=\"http://www.w3.org/2000/svg\"><script/></svg>".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void upload_returns400WithStandardEnvelope_whenFileExceedsMaxUploadSize() throws Exception {
        when(s3StorageService.uploadFile(any())).thenThrow(
                new org.springframework.web.multipart.MaxUploadSizeExceededException(5_000_000)
        );

        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Uploaded file exceeds the maximum allowed size"));
    }

    @Test
    void upload_returns500WithStandardEnvelope_whenStorageThrowsUnexpectedException() throws Exception {
        when(s3StorageService.uploadFile(any())).thenThrow(new RuntimeException("S3 connection refused"));

        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"));
    }
}
