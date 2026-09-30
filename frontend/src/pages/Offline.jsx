const Offline = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#f7f8fc",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
          background: "#ffffff",
          padding: "48px 32px",
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgba(17, 22, 43, 0.10)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 24px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#eef2ff",
            fontSize: "38px",
          }}
        >
          📶
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "30px",
            color: "#11162b",
          }}
        >
          You’re Offline
        </h1>

        <p
          style={{
            margin: "0 auto 28px",
            maxWidth: "400px",
            color: "#667085",
            lineHeight: "1.7",
            fontSize: "16px",
          }}
        >
          No internet connection detected. Don’t worry — your downloaded
          learning content can still be available offline.
        </p>

        <button
          onClick={handleRetry}
          style={{
            border: "none",
            padding: "13px 24px",
            borderRadius: "12px",
            background: "#11162b",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: "600",
          }}
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
};

export default Offline;