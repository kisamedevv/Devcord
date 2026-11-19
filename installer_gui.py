# -*- coding: utf-8 -*-
"""Devcord Installer - GUI (Python/Tkinter), dark theme matching the website."""
import os
import sys
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

APP_NAME = "Devcord"
APP_VERSION = "4.1.0"
BG = "#02040a"
BG2 = "#080d1c"
PANEL = "#0a0f1e"
LINE = "#1a2340"
ACCENT = "#4a57d6"
ACCENT2 = "#7b5cff"
TEXT = "#e2e6f0"
MUTED = "#848da8"
GREEN = "#3aa86a"


class Installer(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(f"{APP_NAME} Installer")
        self.geometry("640x460")
        self.resizable(False, False)
        self.configure(bg=BG)
        try:
            self.iconbitmap(os.path.join(os.path.dirname(__file__), "assets", "app_icon.ico"))
        except Exception:
            pass

        # container
        self.container = tk.Frame(self, bg=BG)
        self.container.pack(fill="both", expand=True)

        # titlebar
        tb = tk.Frame(self.container, bg="#000000", height=38)
        tb.pack(fill="x")
        tb.pack_propagate(False)
        tk.Label(tb, text=f"  {APP_NAME} Installer", bg="#000000", fg=TEXT,
                 font=("Segoe UI", 10, "bold")).pack(side="left", pady=8)
        ctrl = tk.Frame(tb, bg="#000000")
        ctrl.pack(side="right", padx=10)
        for c in ("#ff5f57", "#febc2e", "#28c840"):
            tk.Label(ctrl, text="●", fg=c, bg="#000000", font=("Segoe UI", 12)).pack(side="left", padx=2)

        # body
        self.body = tk.Frame(self.container, bg=BG, padx=34, pady=26)
        self.body.pack(fill="both", expand=True)

        # step bar
        self.step_frame = tk.Frame(self.body, bg=BG)
        self.step_frame.pack(fill="x", pady=(0, 18))
        self.steps = []
        for i in range(5):
            s = tk.Frame(self.step_frame, bg=LINE, height=4)
            s.pack(side="left", fill="x", expand=True, padx=2)
            self.steps.append(s)

        self.content = tk.Frame(self.body, bg=BG)
        self.content.pack(fill="both", expand=True)

        self.status_var = tk.StringVar(value="Hazır.")
        self.progress_var = tk.DoubleVar(value=0)
        self.installing = False

        self.show_intro()

    # ---- screens ----
    def clear_content(self):
        for w in self.content.winfo_children():
            w.destroy()

    def set_step(self, idx):
        for i, s in enumerate(self.steps):
            s.configure(bg=ACCENT2 if i <= idx else LINE)

    def show_intro(self):
        self.clear_content()
        self.set_step(0)
        self._hero("📦", "Devcord kurulumuna hoş geldin",
                   "Discord istemcisine Devcord modu enjekte edilecek. Devam etmeden önce hedefi seç.")
        rows = tk.Frame(self.content, bg=PANEL, bd=0, highlightthickness=1,
                        highlightbackground=LINE)
        rows.pack(fill="x", pady=(12, 16))
        self._row(rows, "Sürüm", APP_VERSION)
        self._row(rows, "Eklenti", "499 paket")
        self._row(rows, "Lisans", "GPL-3.0 · Açık kaynak")

        opts = tk.Frame(self.content, bg=BG)
        opts.pack(fill="x", pady=(4, 10))
        self.opt_start = tk.BooleanVar(value=True)
        self.opt_shortcut = tk.BooleanVar(value=True)
        tk.Checkbutton(opts, text="Kurulum bitince Discord'u başlat",
                       variable=self.opt_start, bg=BG, fg=TEXT,
                       selectcolor=PANEL, activebackground=BG,
                       font=("Segoe UI", 10)).pack(anchor="w")
        tk.Checkbutton(opts, text="Masaüstü kısayolu oluştur",
                       variable=self.opt_shortcut, bg=BG, fg=TEXT,
                       selectcolor=PANEL, activebackground=BG,
                       font=("Segoe UI", 10)).pack(anchor="w")

        self._actions([("İptal", self.destroy, "ghost"),
                       ("Devam", self.show_targets, "primary")])

    def show_targets(self):
        self.clear_content()
        self.set_step(1)
        self._hero("🎯", "Hedef Discord",
                   "Devcord'un enjekte edileceği Discord kanalını seç.")
        channels = ["Discord (Stable)", "Discord (PTB)", "Discord (Canary)", "Discord (Development)"]
        self.channel_var = tk.StringVar(value=channels[0])
        for ch in channels:
            rb = tk.Radiobutton(self.content, text=ch, variable=self.channel_var, value=ch,
                                bg=BG, fg=TEXT, selectcolor=PANEL, activebackground=BG,
                                font=("Segoe UI", 10))
            rb.pack(anchor="w", pady=2)

        path_frame = tk.Frame(self.content, bg=BG)
        path_frame.pack(fill="x", pady=(14, 4))
        tk.Label(path_frame, text="Konum", bg=BG, fg=MUTED, font=("Segoe UI", 9)).pack(anchor="w")
        self.path_var = tk.StringVar(value=r"C:\Users\%USERNAME%\AppData\Local\Discord")
        e = tk.Entry(path_frame, textvariable=self.path_var, bg=PANEL, fg=TEXT,
                     insertbackground=TEXT, relief="flat", font=("Segoe UI", 10))
        e.pack(fill="x", ipady=6, pady=(4, 0))
        tk.Button(path_frame, text="Gözat…", command=self.browse, bg=PANEL, fg=TEXT,
                  relief="flat", font=("Segoe UI", 9)).pack(anchor="e", pady=(4, 0))

        self._actions([("Geri", self.show_intro, "ghost"),
                       ("Devam", self.show_installing, "primary")])

    def show_installing(self):
        self.clear_content()
        self.set_step(2)
        self._hero("⚙️", "Kuruluyor", "Dosyalar kopyalanıyor, lütfen bekleyin.")
        self.progress = ttk.Progressbar(self.content, mode="determinate", maximum=100)
        self.progress.pack(fill="x", pady=(8, 6))
        self.status_lbl = tk.Label(self.content, text="Hazırlanıyor…", bg=BG, fg=MUTED,
                                   font=("Segoe UI", 10))
        self.status_lbl.pack(anchor="w")
        self.log = tk.Text(self.content, height=8, bg=PANEL, fg=MUTED, relief="flat",
                           font=("Consolas", 9), state="disabled")
        self.log.pack(fill="both", expand=True, pady=(10, 0))
        self._actions([("İptal", self.destroy, "ghost")])
        self.installing = True
        threading.Thread(target=self._do_install, daemon=True).start()

    def _do_install(self):
        steps = [
            ("Discord konumu algılanıyor…", 12),
            ("Orijinal asar yedekleniyor…", 28),
            ("Devcord dosyaları kopyalanıyor…", 55),
            ("patcher.js enjekte ediliyor…", 78),
            ("Kısayol oluşturuluyor…", 92),
            ("Tamamlandı.", 100),
        ]
        for msg, pct in steps:
            self._log(msg)
            self._set_progress(pct, msg)
            time.sleep(0.7)
        self.installing = False
        self.after(0, self.show_completed)

    def _set_progress(self, pct, msg):
        self.after(0, lambda: (self.progress.configure(value=pct),
                                self.status_lbl.configure(text=f"{msg}  {pct}%")))

    def _log(self, msg):
        def _append():
            self.log.configure(state="normal")
            self.log.insert("end", f"[{time.strftime('%H:%M:%S')}] {msg}\n")
            self.log.see("end")
            self.log.configure(state="disabled")
        self.after(0, _append)

    def show_completed(self):
        self.clear_content()
        self.set_step(4)
        self._hero("✅", "Kurulum tamamlandı",
                   "Devcord başarıyla kuruldu. Discord'u yeniden başlatarak kullanmaya başla.")
        rows = tk.Frame(self.content, bg=PANEL, highlightthickness=1, highlightbackground=LINE)
        rows.pack(fill="x", pady=(12, 16))
        self._row(rows, "Durum", "Başarılı")
        self._row(rows, "Hedef", self.channel_var.get())
        btns = tk.Frame(self.content, bg=BG)
        btns.pack(fill="x")
        if self.opt_start.get():
            tk.Label(btns, text="Discord başlatılacak.", bg=BG, fg=GREEN,
                     font=("Segoe UI", 10)).pack(anchor="w")
        self._actions([("Kapat", self.destroy, "primary")])

    # ---- helpers ----
    def _hero(self, icon, title, sub):
        f = tk.Frame(self.content, bg=BG)
        f.pack(fill="x", pady=(0, 12))
        tk.Label(f, text=icon, bg=BG, fg=TEXT, font=("Segoe UI Emoji", 34)).pack(side="left", padx=(0, 14))
        t = tk.Frame(f, bg=BG)
        t.pack(side="left", fill="x")
        tk.Label(t, text=title, bg=BG, fg=TEXT, font=("Segoe UI", 16, "bold")).pack(anchor="w")
        tk.Label(t, text=sub, bg=BG, fg=MUTED, font=("Segoe UI", 10),
                 wraplength=460, justify="left").pack(anchor="w", pady=(2, 0))

    def _row(self, parent, k, v):
        r = tk.Frame(parent, bg=PANEL)
        r.pack(fill="x", padx=12, pady=6)
        tk.Label(r, text=k, bg=PANEL, fg=MUTED, font=("Segoe UI", 10)).pack(side="left")
        tk.Label(r, text=v, bg=PANEL, fg=TEXT, font=("Segoe UI", 10, "bold")).pack(side="right")

    def _actions(self, items):
        f = tk.Frame(self.body, bg=BG)
        f.pack(fill="x", side="bottom", pady=(12, 0))
        for label, cmd, kind in items:
            bg = ACCENT if kind == "primary" else PANEL
            fg = "#fff" if kind == "primary" else TEXT
            b = tk.Button(f, text=label, command=cmd, bg=bg, fg=fg, relief="flat",
                          font=("Segoe UI", 10, "bold"), padx=18, pady=8,
                          activebackground=ACCENT2, activeforeground="#fff", cursor="hand2")
            b.pack(side="right" if kind != "ghost" else "left")

    def browse(self):
        d = filedialog.askdirectory()
        if d:
            self.path_var.set(d)


def main():
    app = Installer()
    app.mainloop()


if __name__ == "__main__":
    main()
