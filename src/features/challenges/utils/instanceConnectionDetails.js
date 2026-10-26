const CONNECTION_FIELDS = [
  ["hostname", "호스트"], ["connection_port", "연결 포트"],
  ["tls", "TLS"], ["server_name", "SNI"],
];

export function endpointConnectionDetails(endpoint) {
  return CONNECTION_FIELDS.filter(([field]) => Object.hasOwn(endpoint, field))
    .map(([field, label]) => ({
      label,
      value: endpoint[field] == null ? "미제공"
        : field === "tls" ? endpoint[field] ? "사용" : "사용 안 함"
          : String(endpoint[field]),
    }));
}

export function endpointCopyText(endpoint) {
  return [endpoint.url, ...endpointConnectionDetails(endpoint)
    .map(({ label, value }) => `${label}: ${value}`)].join("\n");
}
