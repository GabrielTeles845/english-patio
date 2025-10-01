interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-12 w-auto" }: LogoProps) => {
  return (
    <img
      src="/assets/logo-index.webp"
      alt="English Patio Logo"
      className={className}
    />
  );
};

export default Logo; 