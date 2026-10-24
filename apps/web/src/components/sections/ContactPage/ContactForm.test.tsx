import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dictionaries } from "@/content";
import ContactForm from "./ContactForm";

// The form reads the page language from the address; here we say it is /fr/.
vi.mock("next/navigation", () => ({ useParams: () => ({ locale: "fr" }) }));

const form = dictionaries.fr.contact.form;

describe("ContactForm", () => {
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    open = vi.fn(() => ({ opener: {} }));
    vi.stubGlobal("open", open);
    window.sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  // The form refuses to send in the first 3 seconds, so the tests move the clock forward.
  const waitedEnough = () => {
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start + 5000);
  };

  it("shows every error in French and sends nothing when the form is empty", async () => {
    const user = userEvent.setup();
    render(<ContactForm form={form} whatsappNumber="212612345678" />);
    waitedEnough();

    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.errors.name)).toBeInTheDocument();
    expect(screen.getByText(form.errors.phone)).toBeInTheDocument();
    expect(screen.getByText(form.errors.need)).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("marks the bad fields for screen readers and focuses the first one", async () => {
    const user = userEvent.setup();
    render(<ContactForm form={form} whatsappNumber="212612345678" />);
    waitedEnough();

    await user.click(screen.getByRole("button", { name: form.submit }));

    const name = screen.getByRole("textbox", { name: new RegExp(form.fields.name.label) });
    expect(name).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(name).toHaveFocus());
  });

  it("opens WhatsApp with the answers written in the visitor language", async () => {
    const user = userEvent.setup();
    render(<ContactForm form={form} whatsappNumber="212612345678" />);
    waitedEnough();

    await user.type(screen.getByLabelText(form.fields.name.label), "Sara Benali");
    await user.type(screen.getByLabelText(form.fields.phone.label), "06 12 34 56 78");
    await user.click(screen.getByRole("button", { name: form.needs[0]! }));
    await user.click(screen.getByRole("button", { name: form.submit }));

    await waitFor(() => expect(open).toHaveBeenCalledTimes(1));
    const url = String(open.mock.calls[0]![0]);
    expect(url.startsWith("https://wa.me/212612345678?text=")).toBe(true);
    const message = decodeURIComponent(url.split("text=")[1]!);
    expect(message).toContain(form.messageTemplate.intro);
    expect(message).toContain("Sara Benali");
    expect(message).toContain(form.needs[0]!);

    // The confirmation and the two fallback links appear.
    expect(await screen.findByText(form.sent)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: form.openWhatsapp })).toHaveAttribute("href", url);
    expect(screen.getByRole("link", { name: form.emailFallback }).getAttribute("href")).toMatch(/^mailto:/);
  });

  it("ignores a robot that fills the hidden field", async () => {
    const user = userEvent.setup();
    const { container } = render(<ContactForm form={form} whatsappNumber="212612345678" />);
    waitedEnough();

    await user.type(screen.getByLabelText(form.fields.name.label), "Bot");
    await user.type(screen.getByLabelText(form.fields.phone.label), "0612345678");
    await user.click(screen.getByRole("button", { name: form.needs[0]! }));
    const trap = container.querySelector<HTMLInputElement>('input[name="company_site"]')!;
    // A person cannot click it (pointer-events: none), but a robot fills it without clicking.
    fireEvent.change(trap, { target: { value: "http://spam" } });
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByText(form.sent)).not.toBeInTheDocument();
  });

  it("asks to check again when the form is sent too fast", async () => {
    const user = userEvent.setup();
    render(<ContactForm form={form} whatsappNumber="212612345678" />);

    await user.type(screen.getByLabelText(form.fields.name.label), "Sara");
    await user.type(screen.getByLabelText(form.fields.phone.label), "0612345678");
    await user.click(screen.getByRole("button", { name: form.needs[0]! }));
    await user.click(screen.getByRole("button", { name: form.submit }));

    expect(await screen.findByText(form.errors.tooFast)).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });

  it("keeps the phone field left to right (also in Arabic)", () => {
    render(<ContactForm form={form} whatsappNumber="212612345678" />);
    expect(screen.getByLabelText(form.fields.phone.label)).toHaveAttribute("dir", "ltr");
  });
});
