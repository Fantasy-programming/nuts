package request

import (
	"fmt"
	"net"
	"net/http"
	"strings"

	"github.com/Fantasy-Programming/nuts/server/internal/utils/message"
	"github.com/google/uuid"
)

var headers = []string{"X-Forward-For", "X-Real-IP"}

func ParseUUID(r *http.Request, paramName string) (uuid.UUID, error) {
	idStr := r.PathValue(paramName)

	if idStr == "" {
		return uuid.Nil, message.ErrMissingParams
	}

	return uuid.Parse(idStr)
}

func IPFromRequest(r *http.Request) (net.IP, error) {
	remoteIP := ""

	for _, header := range headers {
		remoteIP = r.Header.Get(header)

		if http.CanonicalHeaderKey(header) == "X-Forwarded-For" {
			remoteIP = ipFromForwardedForHeader(remoteIP)
		}

		if remoteIP != "" {
			break
		}

	}

	if remoteIP == "" {
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			return nil, err
		}

		remoteIP = host
	}

	ip := net.ParseIP(remoteIP)

	if ip == nil {
		return nil, fmt.Errorf("could not parse IP: %s", remoteIP)
	}

	return ip, nil
}

func ipFromForwardedForHeader(v string) string {
	sep := strings.Index(v, ",")
	if sep == -1 {
		return v
	}
	return v[:sep]
}

// TODO: Change to prod echoip
// func getGeoInfo(ip string) (*repository.GeoInfo, error) {
// 	req, err := http.NewRequest("GET", "http://localhost:3002/json?ip="+ip, nil)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	resp, err := http.DefaultClient.Do(req)
// 	if err != nil {
// 		return nil, err
// 	}
//
// 	defer resp.Body.Close()
//
// 	var info repository.GeoInfo
// 	err = json.NewDecoder(resp.Body).Decode(&info)
// 	return &info, err
// }
