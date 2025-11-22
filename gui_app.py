import customtkinter as ctk
import base64
import gzip
import json
import os
import tkinter as tk
import threading
import webbrowser
from tkinter import filedialog, messagebox

# --- Theme Configuration ---
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue") 

# Colors - Premium Palette
C_BG_MAIN = "#121212"       # Deepest background
C_BG_SIDEBAR = "#1a1a1a"    # Sidebar background
C_BG_CARD = "#242424"       # Card background (lighter than main)
C_BG_INPUT = "#2b2b2b"      # Input field background
C_ACCENT = "#ffaa00"        # Orange Accent
C_ACCENT_HOVER = "#e69900"  # Slightly darker orange
C_TEXT_ON_ACCENT = "#1a1a1a"# Dark text on orange
C_TEXT_MAIN = "#ffffff"     # Primary text
C_TEXT_SUB = "#a0a0a0"      # Secondary text
C_BORDER = "#333333"        # Subtle borders
C_STATUS_BAR = "#ffaa00"    # Status bar background (Orange strip)
C_TEXT_STATUS = "#1a1a1a"   # Text on status bar

# Fonts
F_HEADER = ("Segoe UI", 26, "bold")
F_SUBHEADER = ("Segoe UI", 16, "bold")
F_BODY = ("Segoe UI", 13)
F_MONO = ("Consolas", 12)
F_ICON = ("Segoe UI Emoji", 16) # For icons

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Streamer.bot Export Tool")
        self.geometry("1200x850")
        self.configure(fg_color=C_BG_MAIN)

        # Grid Layout
        self.grid_columnconfigure(0, weight=0) # Sidebar fixed
        self.grid_columnconfigure(1, weight=1) # Content flexible
        self.grid_rowconfigure(0, weight=1)

        # State
        self.current_page = None
        self.pages = {}
        self.nav_buttons = {}

        self.setup_sidebar()
        self.setup_pages()
        
        # Start on Decoder
        self.nav_to("decoder")

    def setup_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, width=240, corner_radius=0, fg_color=C_BG_SIDEBAR)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(6, weight=1) # Spacer

        # Title Area
        title_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        title_frame.grid(row=0, column=0, padx=25, pady=(35, 10), sticky="w")
        ctk.CTkLabel(title_frame, text="SB TOOL", font=("Segoe UI", 32, "bold"), text_color=C_ACCENT).pack(anchor="w")
        ctk.CTkLabel(title_frame, text="v2.1 Pro Edition", font=("Segoe UI", 12), text_color=C_TEXT_SUB).pack(anchor="w")

        # Nav Buttons
        self.create_nav_btn("📂  Decoder", "decoder", 2)
        self.create_nav_btn("📦  Encoder", "encoder", 3)
        self.create_nav_btn("❓  Help Guide", "help", 4)
        
        # Bottom Nav
        self.create_nav_btn("❤  Support Me", "support", 7)

    def create_nav_btn(self, text, key, row):
        btn = ctk.CTkButton(self.sidebar, text=text, height=50, corner_radius=8, 
                            font=("Segoe UI", 15, "bold"), anchor="w",
                            fg_color="transparent", text_color=C_TEXT_SUB,
                            hover_color="#2a2a2a",
                            command=lambda: self.nav_to(key))
        btn.grid(row=row, column=0, padx=15, pady=5, sticky="ew")
        self.nav_buttons[key] = btn

    def nav_to(self, key):
        for k, btn in self.nav_buttons.items():
            if k == key:
                btn.configure(fg_color=C_ACCENT, text_color=C_TEXT_ON_ACCENT, hover_color=C_ACCENT_HOVER)
            else:
                btn.configure(fg_color="transparent", text_color=C_TEXT_SUB, hover_color="#2a2a2a")
        
        if self.current_page: self.current_page.pack_forget()
        self.current_page = self.pages[key]
        self.current_page.pack(fill="both", expand=True, padx=0, pady=0)

    def setup_pages(self):
        self.content_area = ctk.CTkFrame(self, fg_color="transparent")
        self.content_area.grid(row=0, column=1, sticky="nsew")

        self.pages["decoder"] = self.create_decoder_page(self.content_area)
        self.pages["encoder"] = self.create_encoder_page(self.content_area)
        self.pages["help"] = self.create_help_page(self.content_area)
        self.pages["support"] = self.create_support_page(self.content_area)

    # =============================================================================================
    # PAGE: DECODER
    # =============================================================================================
    def create_decoder_page(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        
        # Header
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(40, 20))
        ctk.CTkLabel(header, text="Decoder", font=F_HEADER, text_color=C_TEXT_MAIN).pack(anchor="w")
        ctk.CTkLabel(header, text="Extract C# scripts from Streamer.bot export strings.", font=F_BODY, text_color=C_TEXT_SUB).pack(anchor="w")

        # Card: Input
        card_in = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=12, border_width=1, border_color=C_BORDER)
        card_in.pack(fill="x", padx=40, pady=(0, 20))
        
        toolbar = ctk.CTkFrame(card_in, fg_color="transparent")
        toolbar.pack(fill="x", padx=20, pady=15)
        
        ctk.CTkButton(toolbar, text="📂 Open File", width=120, fg_color=C_BG_INPUT, hover_color="#3a3a3a", command=self.decoder_open_file, border_width=1, border_color=C_BORDER).pack(side="left")
        ctk.CTkLabel(toolbar, text="  or paste string below", text_color=C_TEXT_SUB).pack(side="left")
        self.btn_decode = ctk.CTkButton(toolbar, text="▶ DECODE", width=120, fg_color=C_ACCENT, hover_color=C_ACCENT_HOVER, text_color=C_TEXT_ON_ACCENT, font=("Segoe UI", 13, "bold"), command=self.start_decode_thread)
        self.btn_decode.pack(side="right")

        self.decoder_input = ctk.CTkTextbox(card_in, height=80, fg_color=C_BG_INPUT, text_color=C_TEXT_MAIN, border_width=0, corner_radius=8)
        self.decoder_input.pack(fill="x", padx=20, pady=(0, 20))

        # Card: Output
        card_out = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=12, border_width=1, border_color=C_BORDER)
        card_out.pack(fill="both", expand=True, padx=40, pady=(0, 20))

        self.out_tabs = ctk.CTkTabview(card_out, fg_color="transparent", segmented_button_selected_color=C_ACCENT, segmented_button_selected_hover_color=C_ACCENT_HOVER, segmented_button_unselected_color=C_BG_INPUT, text_color=C_TEXT_ON_ACCENT)
        self.out_tabs.pack(fill="both", expand=True, padx=10, pady=10)
        self.out_tabs.add("C# Scripts")
        self.out_tabs.add("JSON Data")

        # Scripts Tab
        s_tab = self.out_tabs.tab("C# Scripts")
        split = ctk.CTkFrame(s_tab, fg_color="transparent")
        split.pack(fill="both", expand=True)

        # List
        list_frame = ctk.CTkFrame(split, width=260, fg_color=C_BG_INPUT, corner_radius=8, border_width=1, border_color=C_BORDER)
        list_frame.pack(side="left", fill="y", padx=(0, 15))
        
        self.search_var = tk.StringVar()
        self.search_var.trace("w", self.filter_scripts)
        ctk.CTkEntry(list_frame, placeholder_text="🔍 Search...", textvariable=self.search_var, fg_color="transparent", border_width=0).pack(fill="x", padx=10, pady=10)
        ctk.CTkFrame(list_frame, height=1, fg_color=C_BORDER).pack(fill="x") # Divider

        self.script_listbox = tk.Listbox(list_frame, bg=C_BG_INPUT, fg=C_TEXT_MAIN, selectbackground=C_ACCENT, selectforeground=C_TEXT_ON_ACCENT, borderwidth=0, highlightthickness=0, font=("Segoe UI", 11))
        self.script_listbox.pack(side="left", fill="both", expand=True, padx=(5, 0), pady=5)
        self.script_listbox.bind('<<ListboxSelect>>', self.on_script_select)
        
        sb = ctk.CTkScrollbar(list_frame, command=self.script_listbox.yview, button_color=C_ACCENT, button_hover_color=C_ACCENT_HOVER, width=12)
        sb.pack(side="right", fill="y", pady=5, padx=5)
        self.script_listbox.config(yscrollcommand=sb.set)

        # Code
        code_frame = ctk.CTkFrame(split, fg_color=C_BG_INPUT, corner_radius=8, border_width=1, border_color=C_BORDER)
        code_frame.pack(side="right", fill="both", expand=True)
        
        code_head = ctk.CTkFrame(code_frame, height=36, fg_color="transparent")
        code_head.pack(fill="x", padx=10, pady=5)
        ctk.CTkLabel(code_head, text="Code Preview", text_color=C_TEXT_SUB, font=F_MONO).pack(side="left")
        ctk.CTkButton(code_head, text="📋 Copy", width=70, height=24, fg_color=C_BG_CARD, hover_color="#3a3a3a", command=self.copy_code).pack(side="right")

        self.decoder_code_out = ctk.CTkTextbox(code_frame, wrap="none", fg_color="transparent", font=F_MONO, text_color="#d4d4d4")
        self.decoder_code_out.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # JSON Tab
        j_tab = self.out_tabs.tab("JSON Data")
        j_frame = ctk.CTkFrame(j_tab, fg_color=C_BG_INPUT, corner_radius=8, border_width=1, border_color=C_BORDER)
        j_frame.pack(fill="both", expand=True)
        ctk.CTkButton(j_frame, text="📋 Copy JSON", width=100, fg_color=C_BG_CARD, hover_color="#3a3a3a", command=self.copy_json).pack(anchor="ne", padx=10, pady=10)
        self.decoder_json_out = ctk.CTkTextbox(j_frame, wrap="none", fg_color="transparent", font=F_MONO, text_color="#d4d4d4")
        self.decoder_json_out.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Status Bar
        self.create_status_bar(frame)
        
        # Save Button (Floating in Status Bar area)
        self.btn_save_scripts = ctk.CTkButton(self.status_bar, text="💾 Save All Scripts", command=self.save_all_scripts, state="disabled", fg_color="#121212", hover_color="#222", text_color=C_ACCENT, height=24, width=120)
        self.btn_save_scripts.pack(side="right", padx=20)

        # Data
        self.extracted_scripts = {}
        self.script_names = []

        return frame

    # =============================================================================================
    # PAGE: ENCODER
    # =============================================================================================
    def create_encoder_page(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", padx=40, pady=(40, 20))
        ctk.CTkLabel(header, text="Encoder", font=F_HEADER, text_color=C_TEXT_MAIN).pack(anchor="w")
        ctk.CTkLabel(header, text="Create import strings by injecting C# files into a JSON template.", font=F_BODY, text_color=C_TEXT_SUB).pack(anchor="w")

        # Card: Steps
        card = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=12, border_width=1, border_color=C_BORDER)
        card.pack(fill="x", padx=40, pady=(0, 20))

        # Step 1
        ctk.CTkLabel(card, text="1. Base JSON Template", font=F_SUBHEADER, text_color=C_ACCENT).pack(anchor="w", padx=25, pady=(25, 5))
        ctk.CTkLabel(card, text="Select the JSON file defining your actions. Use \"byteCode\": \"filename.cs\" placeholders.", text_color=C_TEXT_SUB).pack(anchor="w", padx=25, pady=(0, 10))
        
        row1 = ctk.CTkFrame(card, fg_color="transparent")
        row1.pack(fill="x", padx=25, pady=(0, 20))
        self.encoder_json_path = ctk.CTkEntry(row1, placeholder_text="Path to template.json", fg_color=C_BG_INPUT, border_width=1, border_color=C_BORDER, height=35)
        self.encoder_json_path.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(row1, text="📂 Browse", width=100, fg_color=C_BG_INPUT, hover_color="#3a3a3a", command=self.browse_json_template, border_width=1, border_color=C_BORDER).pack(side="right")

        # Step 2
        ctk.CTkLabel(card, text="2. Scripts Folder", font=F_SUBHEADER, text_color=C_ACCENT).pack(anchor="w", padx=25, pady=(10, 5))
        ctk.CTkLabel(card, text="Select the folder containing your .cs files referenced in the JSON.", text_color=C_TEXT_SUB).pack(anchor="w", padx=25, pady=(0, 10))
        
        row2 = ctk.CTkFrame(card, fg_color="transparent")
        row2.pack(fill="x", padx=25, pady=(0, 25))
        self.encoder_folder_path = ctk.CTkEntry(row2, placeholder_text="Path to scripts folder", fg_color=C_BG_INPUT, border_width=1, border_color=C_BORDER, height=35)
        self.encoder_folder_path.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ctk.CTkButton(row2, text="📂 Browse", width=100, fg_color=C_BG_INPUT, hover_color="#3a3a3a", command=self.browse_scripts_folder, border_width=1, border_color=C_BORDER).pack(side="right")

        # Action
        self.btn_encode = ctk.CTkButton(frame, text="⚡ GENERATE IMPORT STRING", height=55, fg_color=C_ACCENT, hover_color=C_ACCENT_HOVER, text_color=C_TEXT_ON_ACCENT, font=("Segoe UI", 16, "bold"), command=self.start_encode_thread, corner_radius=12)
        self.btn_encode.pack(fill="x", padx=40, pady=(10, 20))

        # Output
        card_out = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=12, border_width=1, border_color=C_BORDER)
        card_out.pack(fill="both", expand=True, padx=40, pady=(0, 20))
        
        out_head = ctk.CTkFrame(card_out, fg_color="transparent")
        out_head.pack(fill="x", padx=20, pady=15)
        ctk.CTkLabel(out_head, text="Output", font=F_SUBHEADER).pack(side="left")
        ctk.CTkButton(out_head, text="📋 Copy Output", width=120, fg_color=C_BG_INPUT, hover_color="#3a3a3a", command=self.copy_encoded_output, border_width=1, border_color=C_BORDER).pack(side="right")

        self.encoder_output = ctk.CTkTextbox(card_out, wrap="char", fg_color=C_BG_INPUT, border_width=0, corner_radius=8)
        self.encoder_output.pack(fill="both", expand=True, padx=20, pady=(0, 20))

        self.create_status_bar(frame)
        return frame

    # =============================================================================================
    # PAGE: HELP
    # =============================================================================================
    def create_help_page(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        
        ctk.CTkLabel(frame, text="Help Guide", font=F_HEADER, text_color=C_TEXT_MAIN).pack(anchor="w", padx=40, pady=(40, 20))

        card = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=12, border_width=1, border_color=C_BORDER)
        card.pack(fill="both", expand=True, padx=40, pady=(0, 40))

        scroll = ctk.CTkScrollableFrame(card, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=10, pady=10)

        def add_section(title, text):
            ctk.CTkLabel(scroll, text=title, font=F_SUBHEADER, text_color=C_ACCENT).pack(anchor="w", pady=(15, 5))
            ctk.CTkLabel(scroll, text=text, font=F_BODY, text_color=C_TEXT_SUB, justify="left", wraplength=650).pack(anchor="w", pady=(0, 10))

        add_section("Decoding an Export", 
                    "1. Go to the 'Decoder' tab.\n"
                    "2. Click 'Open File' to load a text file containing the export string, or paste it directly into the box.\n"
                    "3. Click 'DECODE'.\n"
                    "4. Browse the extracted C# scripts in the list on the left.\n"
                    "5. Click 'Save All Scripts' to extract them to a folder.")

        add_section("Creating an Export (Encoder)", 
                    "1. Create a 'Base JSON' file that defines your Streamer.bot actions.\n"
                    "2. For any 'Execute C#' sub-action, set the 'byteCode' field to the filename of your script (e.g., \"byteCode\": \"MyScript.cs\").\n"
                    "3. Go to the 'Encoder' tab.\n"
                    "4. Select your Base JSON file.\n"
                    "5. Select the folder where your .cs files are located.\n"
                    "6. Click 'GENERATE'. The tool will inject the code and create a valid import string.")
        
        self.create_status_bar(frame)
        return frame

    # =============================================================================================
    # PAGE: SUPPORT
    # =============================================================================================
    def create_support_page(self, parent):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        
        center = ctk.CTkFrame(frame, fg_color=C_BG_CARD, corner_radius=20, border_width=1, border_color=C_BORDER)
        center.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(center, text="Support the Developer", font=F_HEADER, text_color=C_ACCENT).pack(padx=60, pady=(50, 10))
        ctk.CTkLabel(center, text="If you find this tool useful, consider supporting the project!", font=F_BODY, text_color=C_TEXT_SUB).pack(padx=60, pady=(0, 40))

        def open_link(url): webbrowser.open(url)

        btn_ko = ctk.CTkButton(center, text="☕ Buy me a Coffee", height=55, width=220, fg_color="#FF5E5B", hover_color="#D93B38", font=("Segoe UI", 14, "bold"),
                               command=lambda: open_link("https://ko-fi.com"))
        btn_ko.pack(pady=10)

        btn_gh = ctk.CTkButton(center, text="⭐ Star on GitHub", height=55, width=220, fg_color="#333", hover_color="#222", font=("Segoe UI", 14, "bold"),
                               command=lambda: open_link("https://github.com"))
        btn_gh.pack(pady=10)
        
        ctk.CTkLabel(center, text="Thank you for using Streamer.bot Export Tool!", text_color="gray40").pack(pady=(40, 50))

        self.create_status_bar(frame)
        return frame

    # =============================================================================================
    # SHARED COMPONENTS
    # =============================================================================================
    def create_status_bar(self, parent):
        self.status_bar = ctk.CTkFrame(parent, height=32, fg_color=C_STATUS_BAR, corner_radius=0)
        self.status_bar.pack(side="bottom", fill="x")
        
        self.status_label = ctk.CTkLabel(self.status_bar, text="Ready", text_color=C_TEXT_STATUS, font=("Segoe UI", 12, "bold"))
        self.status_label.pack(side="left", padx=20)
        
        self.progress_bar = ctk.CTkProgressBar(self.status_bar, width=200, mode="indeterminate", progress_color="#121212", fg_color="#cc8800")

    # =============================================================================================
    # LOGIC: DECODER
    # =============================================================================================
    def decoder_open_file(self):
        path = filedialog.askopenfilename(filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")])
        if path:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self.decoder_input.delete("1.0", "end")
                    self.decoder_input.insert("1.0", f.read().strip())
                self.status_label.configure(text=f"Loaded: {os.path.basename(path)}")
            except Exception as e:
                messagebox.showerror("Error", str(e))

    def start_decode_thread(self):
        self.btn_decode.configure(state="disabled")
        self.progress_bar.pack(side="right", padx=20)
        self.progress_bar.start()
        self.status_label.configure(text="Decoding...")
        threading.Thread(target=self.decode_logic, daemon=True).start()

    def decode_logic(self):
        try:
            raw = self.decoder_input.get("1.0", "end").strip()
            if not raw: raise ValueError("Empty input")

            try: compressed = base64.b64decode(raw)
            except: raise ValueError("Invalid Base64")

            if compressed.startswith(b'SBAE'): compressed = compressed[4:]

            try: json_bytes = gzip.decompress(compressed)
            except: raise ValueError("Invalid Gzip data")

            data = json.loads(json_bytes)
            self.after(0, lambda: self.on_decode_success(data))
        except Exception as e:
            self.after(0, lambda: self.on_decode_error(str(e)))

    def on_decode_success(self, data):
        self.decoder_json_out.delete("1.0", "end")
        self.decoder_json_out.insert("1.0", json.dumps(data, indent=4))

        self.extracted_scripts = {}
        self.script_names = []
        self.extract_scripts_recursive(data)
        self.update_script_list()

        self.btn_decode.configure(state="normal")
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.btn_save_scripts.configure(state="normal")
        self.status_label.configure(text=f"Success! Found {len(self.extracted_scripts)} scripts.")

    def on_decode_error(self, msg):
        self.btn_decode.configure(state="normal")
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.status_label.configure(text="Error")
        messagebox.showerror("Decode Error", msg)

    def extract_scripts_recursive(self, obj, count=0):
        if isinstance(obj, dict):
            if 'byteCode' in obj and isinstance(obj['byteCode'], str):
                try:
                    code = base64.b64decode(obj['byteCode']).decode('utf-8')
                    name = obj.get('name', f'script_{count}')
                    safe_name = "".join([c for c in name if c.isalpha() or c.isdigit() or c in ' _-']).strip()
                    fname = f"{safe_name}.cs"
                    if fname in self.extracted_scripts: fname = f"{safe_name}_{count}.cs"
                    self.extracted_scripts[fname] = code
                    self.script_names.append(fname)
                    count += 1
                except: pass
            for v in obj.values(): count = self.extract_scripts_recursive(v, count)
        elif isinstance(obj, list):
            for v in obj: count = self.extract_scripts_recursive(v, count)
        return count

    def update_script_list(self):
        self.script_listbox.delete(0, "end")
        term = self.search_var.get().lower()
        for name in self.script_names:
            if term in name.lower(): self.script_listbox.insert("end", name)

    def filter_scripts(self, *args): self.update_script_list()

    def on_script_select(self, event):
        sel = self.script_listbox.curselection()
        if sel:
            fname = self.script_listbox.get(sel[0])
            self.decoder_code_out.delete("1.0", "end")
            self.decoder_code_out.insert("1.0", self.extracted_scripts.get(fname, ""))

    def copy_json(self):
        self.clipboard_clear()
        self.clipboard_append(self.decoder_json_out.get("1.0", "end"))
        self.status_label.configure(text="JSON copied")

    def copy_code(self):
        self.clipboard_clear()
        self.clipboard_append(self.decoder_code_out.get("1.0", "end"))
        self.status_label.configure(text="Code copied")

    def save_all_scripts(self):
        if not self.extracted_scripts: return
        d = filedialog.askdirectory()
        if d:
            try:
                for f, c in self.extracted_scripts.items():
                    with open(os.path.join(d, f), 'w', encoding='utf-8') as file: file.write(c)
                self.status_label.configure(text=f"Saved {len(self.extracted_scripts)} files.")
                messagebox.showinfo("Saved", f"Saved {len(self.extracted_scripts)} files.")
            except Exception as e: messagebox.showerror("Error", str(e))

    # =============================================================================================
    # LOGIC: ENCODER
    # =============================================================================================
    def browse_json_template(self):
        f = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json")])
        if f: self.encoder_json_path.delete(0, "end"); self.encoder_json_path.insert(0, f)

    def browse_scripts_folder(self):
        d = filedialog.askdirectory()
        if d: self.encoder_folder_path.delete(0, "end"); self.encoder_folder_path.insert(0, d)

    def start_encode_thread(self):
        self.btn_encode.configure(state="disabled")
        self.progress_bar.pack(side="right", padx=20)
        self.progress_bar.start()
        self.status_label.configure(text="Encoding...")
        threading.Thread(target=self.encode_logic, daemon=True).start()

    def encode_logic(self):
        try:
            json_path = self.encoder_json_path.get().strip()
            folder_path = self.encoder_folder_path.get().strip()

            if not json_path or not os.path.exists(json_path): raise ValueError("Invalid JSON Template path")
            if not folder_path or not os.path.exists(folder_path): raise ValueError("Invalid Scripts Folder path")

            with open(json_path, 'r', encoding='utf-8') as f: data = json.load(f)
            count = self.inject_scripts_recursive(data, folder_path)
            
            json_str = json.dumps(data)
            compressed = gzip.compress(json_str.encode('utf-8'))
            final_bytes = b'SBAE' + compressed
            encoded_str = base64.b64encode(final_bytes).decode('utf-8')

            self.after(0, lambda: self.on_encode_success(encoded_str, count))
        except Exception as e:
            self.after(0, lambda: self.on_encode_error(str(e)))

    def inject_scripts_recursive(self, obj, folder, count=0):
        if isinstance(obj, dict):
            if 'byteCode' in obj and isinstance(obj['byteCode'], str):
                val = obj['byteCode']
                if val.endswith('.cs'):
                    file_path = os.path.join(folder, val)
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            b64_code = base64.b64encode(f.read().encode('utf-8')).decode('utf-8')
                        obj['byteCode'] = b64_code
                        count += 1
            for v in obj.values(): count = self.inject_scripts_recursive(v, folder, count)
        elif isinstance(obj, list):
            for v in obj: count = self.inject_scripts_recursive(v, folder, count)
        return count

    def on_encode_success(self, result, count):
        self.encoder_output.delete("1.0", "end")
        self.encoder_output.insert("1.0", result)
        self.btn_encode.configure(state="normal")
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.status_label.configure(text=f"Encoded successfully! Injected {count} scripts.")
        messagebox.showinfo("Success", f"Generated import string with {count} scripts injected.")

    def on_encode_error(self, msg):
        self.btn_encode.configure(state="normal")
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.status_label.configure(text="Encoding Failed")
        messagebox.showerror("Encoder Error", msg)

    def copy_encoded_output(self):
        self.clipboard_clear()
        self.clipboard_append(self.encoder_output.get("1.0", "end"))
        self.status_label.configure(text="Import string copied")

if __name__ == "__main__":
    app = App()
    app.mainloop()
