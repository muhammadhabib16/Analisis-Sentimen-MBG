# -*- coding: utf-8 -*-
"""
Script untuk merombak, membersihkan, dan memperkaya kamus leksikon Bahasa Indonesia
(kamus/positive.txt & kamus/negative.txt) dengan:
1. Pembersihan kata ambigu (overlap) & operator negasi.
2. Kosakata opini positif & negatif Bahasa Indonesia + Bahasa Inggris populer.
3. Kata kasar / makian / umpatan vulgar (Indonesia, daerah, slang medsos, & luar negeri).
4. Kata penolakan / tuntutan / kritik kebijakan & domain MBG.
"""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
POS_PATH = os.path.join(BASE_DIR, "positive.txt")
NEG_PATH = os.path.join(BASE_DIR, "negative.txt")

with open(POS_PATH, "r", encoding="utf-8") as f:
    pos_words = set(line.strip().lower() for line in f if line.strip())

with open(NEG_PATH, "r", encoding="utf-8") as f:
    neg_words = set(line.strip().lower() for line in f if line.strip())

# 1. Hapus kata yang tumpang tindih (overlap) di kedua kamus
overlap = pos_words.intersection(neg_words)
pos_words -= overlap
neg_words -= overlap

# 2. Hapus kata netral / operator negasi / kata benda umum yang salah masuk ke kamus
FALSE_POSITIVES_IN_POS = {
    "makanan", "gratis", "makan", "bergizi", "muda", "hati", "terima",
    "kerja", "besar", "tinggi", "baru", "kaya", "jelas", "cukup", "masak",
    "alami", "asli", "biasa", "cepat", "dalam", "dekat", "depan", "hidup",
    "anak", "rakyat", "program", "pemerintah", "presiden", "negara"
}

FALSE_NEGATIVES_IN_NEG = {
    "tidak", "bukan", "jangan", "kurang", "belum", "tak", "gak", "nggak", "ngga", "ga", "g", "gk",
    "perjuangan", "membela", "kritis", "bergerak", "keras", "lawan", "asing",
    "kritik", "mengkritik", "anak yatim", "air terjun", "banyak sekali", "aneh lagi",
    "artinya jika", "alat permainan", "suara", "cari", "turun", "habis", "hilang"
}

pos_words -= FALSE_POSITIVES_IN_POS
neg_words -= FALSE_NEGATIVES_IN_NEG

# 3. Kosakata Positif Lengkap (Indonesia + Slang + Inggris)
DOMAIN_POS_ADDITIONS = {
    # Dukungan & Apresiasi Indonesia
    "berani", "semoga", "amin", "aamiin", "ayo", "lanjutkan", "teruskan", "berjuang", "pertahankan", "tingkatkan",
    "mantap", "keren", "setuju", "dukung", "mendukung", "dukungan", "salut", "bangga",
    "hebat", "cerdas", "pintar", "jenius", "jujur", "amanah", "berkah", "barokah",
    "bermanfaat", "manfaat", "berguna", "guna", "membantu", "terbantu", "solusi",
    "sehat", "higienis", "kenyang", "enak", "lezat", "nikmat", "gurih", "segar",
    "layak", "merata", "sukses", "maju", "optimis", "apresiasi", "terimakasih",
    "terima kasih", "makasih", "alhamdulillah", "syukur", "bersyukur", "bagus",
    "baik", "terbaik", "suka", "senang", "bahagia", "gembira", "puas", "memuaskan",
    "semangat", "peduli", "pahlawan", "pejuang", "merdeka", "keadilan", "kebenaran",
    "melindungi", "bersatu", "kompak", "bijak", "bijaksana", "tegas", "merakyat",
    "sejahtera", "makmur", "cerah", "gemilang", "inspiratif", "teladan", "bermutu",
    "berkualitas", "rapi", "bersih", "aman", "nyaman", "lancar", "berhasil",
    "berfaedah", "faedah", "positif", "unggul", "juara", "brilian", "jempolan",
    # Slang Positif Medsos
    "menyala", "mantul", "jos", "joss", "gacor", "top", "kece", "cakep",
    "panutan", "idola", "the best", "bestie", "respect", "gg", "keren abis",
    # Bahasa Inggris Positif Populer
    "good", "great", "awesome", "amazing", "excellent", "nice", "love", "like",
    "support", "proud", "happy", "helpful", "useful", "healthy", "delicious",
    "clean", "fresh", "smart", "brilliant", "perfect", "wonderful", "fantastic",
    "success", "positive", "worth", "bravo", "cool", "super", "best"
}

# 4. Kosakata Negatif Lengkap (Penolakan, Kritik, Kata Kasar/Vulgar Indonesia, Daerah & Luar Negeri)
DOMAIN_NEG_ADDITIONS = {
    # Penolakan, Pembubaran & Kritik Kebijakan
    "hapus", "hapuskan", "menghapus", "dihapus", "bubar", "bubarkan", "membubarkan", "dibubarkan",
    "batal", "batalkan", "membatalkan", "dibatalkan", "henti", "hentikan", "menghentikan", "dihentikan",
    "stop", "tolak", "menolak", "ditolak", "cabut", "mencabut", "dicabut", "ganti", "pecat", "mundur",
    "boikot", "protes", "demo", "kecam", "mengecam", "dikecam", "kutuk", "mengutuk", "tumbang",
    # Korupsi, Politik Negatif & Kebohongan
    "koruptor", "korupsi", "korup", "maling", "rampok", "merampok", "garong", "tilep", "ditilep",
    "tilap", "embat", "sunat", "disunat", "potong", "dipotong", "bocor", "mark up", "markup",
    "fiktif", "bodong", "omon", "omdo", "omong kosong", "rezim", "oligarki", "nepotisme",
    "dinasti", "diktator", "otoriter", "tumbal", "beban", "utang", "hutang", "pencitraan",
    "gimik", "gimmick", "drama", "sandiwara", "palsu", "boongan", "abal", "hoax", "hoaks",
    "bohong", "pembohong", "penipu", "tipu", "menipu", "tertipu", "buzzer", "bayaran", "penjilat",
    "jilat", "pengkhianat", "khianat", "munafik", "hipokrit", "zalim", "dzalim", "kejam", "sadis",
    "rakus", "serakah", "tamak", "licik", "curang", "manipulasi", "propaganda", "bobrok",
    # Kualitas Buruk & Bencana MBG
    "basi", "keracunan", "racun", "beracun", "berulat", "ulat", "belatung", "bau", "busuk",
    "mentah", "hambar", "gosong", "kotor", "jorok", "kumuh", "amis", "tengik", "mubazir",
    "sia", "percuma", "kacau", "berantakan", "amburadul", "semrawut", "hancur", "ancur",
    "parah", "buruk", "jelek", "rusak", "gagal", "zonk", "sampah", "ampas", "diare", "muntah",
    "kecewa", "mengecewakan", "marah", "muak", "mual", "eneg", "enek", "bosan", "benci",
    "pembenci", "nyusahin", "menyusahkan", "merugikan", "rugi", "tekor", "boncos", "bangkrut",
    "telat", "terlambat", "pelit", "kikir", "medit", "sedikit", "mahal", "cekik", "mencekik",
    "sengsara", "menderita", "melarat", "miskin", "lapar", "kelaparan", "teror", "ancaman",
    "intimidasi", "bungkam", "dibungkam", "kdrt", "malu", "memalukan", "miris", "prihatin",
    "kasihan", "takut", "ngeri", "bahaya", "berbahaya", "salah", "keliru", "ngawur", "ngaco",
    "lawak", "melawak", "badut", "dagelan", "konyol", "aneh", "absurd", "payah", "lemah",
    "cemen", "pecundang", "pengecut", "norak", "katro", "kampungan", "murahan",
    # Kata Kasar / Makian / Vulgar / Kelamin (Indonesia, Jawa, Sunda, Batak, Makassar, Slang)
    "anjing", "anjir", "anjg", "ajg", "anjrit", "asu", "babi", "monyet", "kunyuk", "kampret",
    "cebong", "kadrun", "bangsat", "bgst", "bngst", "bajingan", "bjngn", "brengsek", "berengsek",
    "keparat", "sialan", "bedebah", "biadab", "laknat", "jahanam", "setan", "iblis",
    "dajjal", "kafir", "najis", "jijik", "menjijikkan", "tai", "taik", "tahi", "berak",
    "bacot", "bacod", "bcd", "congor", "cocot", "lambe", "nyinyir", "julid",
    "goblok", "gblok", "gblk", "tolol", "tll", "bodoh", "bego", "bloon", "dungu",
    "pandir", "idiot", "sinting", "gila", "sarap", "stres", "stress", "edan", "gendeng",
    "jancok", "jancuk", "cuk", "cok", "dancok", "jmbd", "jembut", "jmbt",
    "pantek", "pukimak", "kimak", "sundala", "telaso", "lanciau", "lancau", "cibai", "chibai",
    "kontol", "kntl", "ktl", "titit", "tytyd", "peler", "pler", "biji", "memek", "mmk", "meki",
    "pepek", "ppk", "puki", "ngentot", "entot", "kentot", "ngocok", "colmek", "coli",
    "perek", "lonte", "pelacur", "sundal", "banci", "bencong", "jablay", "jamet", "alay",
    "itil", "tetek", "toket", "sange", "bokep", "mesum", "cabul", "bejat",
    "kurap", "provokator", "profokator", "antek", "perampasan", "rampas", "sok", "sombong",
    "angkuh", "jahat", "susah", "sulit", "matamu", "ndasmu", "matane", "asu tenan",
    # Kata Kasar & Negatif Bahasa Inggris / Luar Negeri
    "fuck", "fucking", "fucker", "motherfucker", "mf", "wtf", "stfu", "shit", "bullshit",
    "ass", "asshole", "arsehole", "bitch", "bastard", "dick", "dickhead", "cock", "pussy",
    "cunt", "slut", "whore", "wanker", "twat", "prick", "douche", "douchebag", "jerk",
    "idiot", "stupid", "moron", "dumb", "dumbass", "imbecile", "retard", "retarded",
    "loser", "pathetic", "useless", "worthless", "trash", "garbage", "rubbish", "crap",
    "scam", "fraud", "corrupt", "corruption", "liar", "fake", "toxic", "disgusting",
    "terrible", "horrible", "awful", "worst", "bad", "hate", "angry", "disappointed",
    "fail", "failure", "suck", "sucks", "hell", "damn", "damned", "cringe"
}

pos_words |= DOMAIN_POS_ADDITIONS
neg_words -= DOMAIN_POS_ADDITIONS
neg_words |= DOMAIN_NEG_ADDITIONS
pos_words -= DOMAIN_NEG_ADDITIONS

with open(POS_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(pos_words)) + "\n")

with open(NEG_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(neg_words)) + "\n")

print(f"Kamus berhasil dirombak! Positif: {len(pos_words)} kata, Negatif: {len(neg_words)} kata.")
