"use client";
import { useState, FormEvent } from "react";

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: "signup" | "login";
  onSubmit: (data: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
}

export function AuthForm({ title, subtitle, fields, onSubmit }: AuthFormProps) {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [state, setState] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setMessage("");

    try {
      const submitData =
        fields === "signup"
          ? { phone: formData.phone, email: formData.email, name: formData.name, password: formData.password }
          : { email: formData.email, password: formData.password };

      const result = await onSubmit(submitData);
      if (result.ok) {
        setState("success");
        setMessage(fields === "signup" ? "Signup successful! Redirecting..." : "Login successful! Redirecting...");
        setFormData({ phone: "", email: "", name: "", password: "", confirmPassword: "" });
      } else {
        setState("error");
        setMessage(result.error || "An error occurred");
      }
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <div className="formPanel" style={{ maxWidth: "520px", margin: "40px auto" }}>
      <h2 style={{ color: "#3d101a", fontFamily: "Georgia, serif", fontSize: "2rem", marginTop: 0 }}>{title}</h2>
      <p style={{ color: "#60716c", marginBottom: "28px" }}>{subtitle}</p>

      <form className="form" onSubmit={handleSubmit}>
        {fields === "signup" && (
          <>
            <input
              type="tel"
              placeholder="Phone (10 digits)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              pattern="[0-9]{10}"
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          minLength={8}
          required
        />

        {fields === "signup" && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            minLength={8}
            required
          />
        )}

        <button
          type="submit"
          className="btn"
          disabled={state === "busy"}
          style={{ marginTop: "8px", width: "100%" }}
        >
          {state === "busy" ? "Processing..." : fields === "signup" ? "Create Account" : "Sign In"}
        </button>
      </form>

      {state === "success" && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#e8f5e9",
            color: "#2e7d32",
            borderRadius: "8px",
            fontSize: "14px",
          }}
          role="status"
        >
          ✓ {message}
        </div>
      )}

      {state === "error" && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "8px",
            fontSize: "14px",
          }}
          role="alert"
        >
          ✕ {message}
        </div>
      )}
    </div>
  );
}
