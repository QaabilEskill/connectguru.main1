import { useEffect } from "react";

export default function AdminRedirect() {
  useEffect(() => {
    window.location.replace("/admin.html");
  }, []);
  return null;
}
