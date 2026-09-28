import { WHATSAPP_CHAT_LINK } from "@/lib/services";

export function WhatsAppFab() {
  return (
    <a
      href={WHATSAPP_CHAT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with The Record Hub on WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] shadow-elegant transition-transform hover:scale-110 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 32 32" className="size-7 fill-white" aria-hidden="true">
        <path d="M16.04 3C9.42 3 4.06 8.36 4.06 14.98c0 2.11.55 4.17 1.6 5.99L3 29l8.22-2.6a11.9 11.9 0 0 0 4.82 1.01h.01c6.62 0 11.98-5.36 11.98-11.98C28.03 8.36 22.66 3 16.04 3zm0 21.6c-1.5 0-2.98-.4-4.27-1.17l-.31-.18-4.88 1.54 1.56-4.76-.2-.32a9.6 9.6 0 0 1-1.48-5.13c0-5.31 4.32-9.63 9.64-9.63 5.31 0 9.62 4.32 9.62 9.63 0 5.32-4.31 9.62-9.68 9.62zm5.29-7.2c-.29-.15-1.71-.85-1.98-.94-.26-.1-.46-.15-.65.14-.19.29-.74.94-.91 1.13-.17.19-.34.22-.62.07-.29-.14-1.22-.45-2.32-1.44-.86-.76-1.44-1.7-1.61-1.99-.17-.29-.02-.44.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.65-1.57-.89-2.15-.24-.57-.47-.49-.65-.5h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.16 2.95c.14.19 2 3.06 4.85 4.29.68.29 1.2.47 1.61.6.68.21 1.29.18 1.78.11.54-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34z" />
      </svg>
    </a>
  );
}
