type Props = { searchParams: Promise<{ error?: string; next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ padding: 0, marginBottom: 18 }}>
          <span className="dot" />
          <span>Meddler</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in</h1>
        <p className="muted" style={{ marginTop: 4, marginBottom: 20 }}>
          Enter the system secret to continue.
        </p>
        <form action="/api/auth/login" method="post">
          <input type="hidden" name="next" value={sp.next || "/admin"} />
          <div className="field">
            <label htmlFor="secret">System secret</label>
            <input
              id="secret"
              name="secret"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          {sp.error && <div className="error-banner" style={{ marginBottom: 12 }}>Invalid secret.</div>}
          <button type="submit" style={{ width: "100%" }}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
