interface ButtonProps {
  variant?: "primary" | "secondary";
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  variant = "primary",
  onClick,
  children,
  className = "",
  disabled = false,
}: ButtonProps) {
  const base =
    "font-display tracking-wide text-xl rounded-2xl px-6 py-4 shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none";
  const styles = {
    primary: "bg-red-primary text-white hover:bg-red-dark",
    secondary:
      "bg-white text-red-primary border-2 border-red-primary hover:bg-red-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
