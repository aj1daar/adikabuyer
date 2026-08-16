package com.adikabuyer.catalog.media;

import com.adikabuyer.catalog.security.JwtUtil;
import com.adikabuyer.catalog.security.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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
@Import({SecurityConfig.class, JwtUtil.class})
@TestPropertySource(properties = {
        "app.jwt.secret=test-secret-key-that-is-at-least-32-bytes-long",
        "app.jwt.expiration-ms=3600000"
})
class MediaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
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
    void upload_returns403_whenNoTokenProvided() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", "content".getBytes());

        mockMvc.perform(multipart("/api/media/upload").file(file))
                .andExpect(status().isForbidden());

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
}
