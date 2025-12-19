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

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

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
	backendURL, err := url.Parse("http://localhost:8080")
	if err != nil {
		log.Fatal(err)
	}
	proxy := httputil.NewSingleHostReverseProxy(backendURL)
	fs := http.FileServer(http.Dir(dir))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, ".js") || strings.HasSuffix(r.URL.Path, ".css") {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		} else if strings.HasSuffix(r.URL.Path, ".png") || strings.HasSuffix(r.URL.Path, ".jpg") {
			w.Header().Set("Cache-Control", "public, max-age=31536000")
		}

		if strings.HasPrefix(r.URL.Path, "/api/") {
			log.Printf("Proxying API request: %s", r.URL.Path)
			proxy.ServeHTTP(w, r)
			return
		}

		fs.ServeHTTP(w, r)
	})

	gzipHandler := gzipMiddleware(handler)

	log.Printf("🌍 Frontend Server serving '%s'", dir)
	log.Println("📡 Proxying /api/* requests")
	log.Println("⚡ Gzip compression enabled")

	err = http.ListenAndServe("0.0.0.0:3000", gzipHandler)
	if err != nil {
		log.Fatal(err)
	}
}
