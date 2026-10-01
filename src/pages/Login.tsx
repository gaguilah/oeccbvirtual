import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { Container } from "../components/layout";
import { Alert, Button, Card, CardBody, Input } from "../components/ui";

// Solo inicio de sesión: las cuentas no se crean desde la vista pública.
const credentialsSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "Ingrese su contraseña"),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = credentialsSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(result.data);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <Container className="flex justify-center py-12 sm:py-20">
      <Card className="w-full max-w-sm">
        <CardBody className="space-y-6">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Procesando..." : "Entrar"}
            </Button>
          </form>

          {error && <Alert variant="error">{error}</Alert>}
        </CardBody>
      </Card>
    </Container>
  );
}
