package main

import (
	"compress/gzip"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"
)

// Gzip wrapper
type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

// Gzip middleware
func gzipMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()

		gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzw, r)
	})
}

func main() {
	// Try to find the frontend directory
	paths := []string{"./frontend", "../frontend", "../../frontend"}
	var dir string
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			dir = p
			break
		}
	}

	if dir == "" {
		log.Fatal("❌ Could not find 'frontend' directory. Please run this from the project root or backend directory.")
	}

	// Parse backend URL for API proxy
	backendURL, err := url.Parse("http://localhost:8080")
	if err != nil {
		log.Fatal(err)
	}

	// Create reverse proxy for API requests
	proxy := httputil.NewSingleHostReverseProxy(backendURL)

	// Serve static files
	fs := http.FileServer(http.Dir(dir))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set cache headers for static assets
		if strings.HasSuffix(r.URL.Path, ".js") || strings.HasSuffix(r.URL.Path, ".css") {
			w.Header().Set("Cache-Control", "public, max-age=31536000") // 1 year
		} else if strings.HasSuffix(r.URL.Path, ".png") || strings.HasSuffix(r.URL.Path, ".jpg") {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		// Proxy API requests to backend
		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("Proxying API request: %s", r.URL.Path)
			proxy.ServeHTTP(w, r)
			return
		}

		// Serve static files
		fs.ServeHTTP(w, r)
	})

	// Wrap with gzip
	gzipHandler := gzipMiddleware(handler)

	log.Printf("🌍 Frontend Server serving '%s' on http://localhost:3000", dir)
	log.Println("📡 Proxying /api/* requests to http://localhost:8080")
	log.Println("⚡ Gzip compression enabled")
	log.Println("👉 Click here to open: http://localhost:3000/index.html")
	log.Println("📱 Mobile testing: http://<your-ip>:3000 (use 'hostname -I' to find IP)")

	err = http.ListenAndServe("0.0.0.0:3000", gzipHandler)
	if err != nil {
		log.Fatal(err)
	}
}
