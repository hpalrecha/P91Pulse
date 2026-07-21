package httpapi

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// mountStatic serves the built React app (web/dist) with SPA fallback: any
// path that isn't a real file returns index.html, so client-side routing
// (wouter) works on a hard refresh/deep link. Lets Go serve API + frontend
// from one origin — no CORS/cross-site-cookie complexity in production.
// If dist doesn't exist (local `go run` without a frontend build), this is a
// no-op so `go run ./cmd/server` + `pnpm dev` keeps working unchanged.
func mountStatic(r interface{ Get(string, http.HandlerFunc) }, dir string) {
	indexPath := filepath.Join(dir, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		log.Printf("static: %s not found, skipping (frontend not built — fine in local dev)", indexPath)
		return
	}
	fs := http.FileServer(http.Dir(dir))
	r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
		full := filepath.Join(dir, filepath.Clean(req.URL.Path))
		if info, err := os.Stat(full); err == nil && !info.IsDir() {
			fs.ServeHTTP(w, req)
			return
		}
		http.ServeFile(w, req, indexPath)
	})
	log.Printf("static: serving frontend from %s", dir)
}
