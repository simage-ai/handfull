import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Image
            src="/blue-transparent-simage-just-logo.svg"
            alt="Simage AI"
            width={30}
            height={30}
            className="dark:invert"
          />
          <span className="">A fun project by&nbsp;
            <Link
              href="https://simage.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Simage
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
