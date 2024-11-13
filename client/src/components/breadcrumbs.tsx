import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link to="/" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {paths.map((path, index) => (
        <div key={path} className="flex items-center">
          <ChevronRight className="h-4 w-4" />
          <Link
            to={`/${paths.slice(0, index + 1).join("/")}`}
            className="ml-1 capitalize hover:text-foreground"
          >
            {path}
          </Link>
        </div>
      ))}
    </nav>
  );
}
