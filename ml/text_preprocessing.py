# ==============================================================================
# UTILITAS PREPROCESSING TEKS NETRAL (TANPA KAMUS LEKSIKON)
# Digunakan bersama oleh tahap pelabelan, training model, dan inference API.
# ==============================================================================

import re
import pandas as pd

LABEL_MAPPING = {'Negatif': 0, 'Netral': 1, 'Positif': 2}
ID_TO_LABEL = {0: 'Negatif', 1: 'Netral', 2: 'Positif'}

NEGATION_WORDS = {
    'tidak', 'bukan', 'jangan', 'kurang', 'gak', 'nggak', 'ngga', 'ga', 'tak', 'belum'
}

NON_NEGATION_FOLLOWERS = {
    'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'untuk', 'buat', 'dengan',
    'tapi', 'namun', 'padahal', 'tetapi', 'karena', 'jika', 'kalau', 'ini', 'itu'
}

SLANG_MAP = {
    'yg': 'yang', 'jgn': 'jangan', 'jngn': 'jangan', 'dont': 'jangan',
    'g': 'tidak', 'ga': 'tidak', 'gak': 'tidak', 'nggak': 'tidak', 'ngga': 'tidak',
    'gk': 'tidak', 'gx': 'tidak', 'tdk': 'tidak', 'tak': 'tidak', 'ndak': 'tidak',
    'kagak': 'tidak', 'kaga': 'tidak', 'kgk': 'tidak', 'ora': 'tidak', 'no': 'tidak',
    'bkn': 'bukan', 'krg': 'kurang', 'blm': 'belum', 'blom': 'belum',
    'bnyk': 'banyak', 'lbh': 'lebih', 'org': 'orang', 'sj': 'saja', 'aja': 'saja',
    'lg': 'lagi', 'tsb': 'tersebut', 'dgn': 'dengan', 'utk': 'untuk', 'buat': 'untuk',
    'krn': 'karena', 'kalo': 'kalau', 'kl': 'kalau', 'dr': 'dari', 'sdh': 'sudah',
    'udh': 'sudah', 'udah': 'sudah', 'bgt': 'banget', 'bngt': 'banget', 'dlm': 'dalam',
    'tp': 'tapi', 'tpi': 'tapi', 'sy': 'saya', 'aq': 'aku', 'gw': 'saya', 'gue': 'saya',
    'lu': 'kamu', 'lo': 'kamu',
    # Singkatan kata kasar / populer medsos
    'ajg': 'anjing', 'anjg': 'anjing', 'anjrit': 'anjing', 'bgst': 'bangsat', 'bngst': 'bangsat',
    'bjngn': 'bajingan', 'gblk': 'goblok', 'gblg': 'goblok', 'gblok': 'goblok', 'tll': 'tolol',
    'bgo': 'bodoh', 'kntl': 'kontol', 'ktl': 'kontol', 'mmk': 'memek', 'ppk': 'pepek',
    'jmbt': 'jembut', 'jmbd': 'jembut', 'pler': 'peler', 'bcd': 'bacot', 'bacod': 'bacot',
    'lwak': 'lawak', 'lwk': 'lawak', 'hbg': 'mbg', 'wtf': 'fuck',
    'krp': 'korup', 'krpsi': 'korupsi', 'bgs': 'bagus', 'mntp': 'mantap',
    'mksh': 'terimakasih', 'thx': 'terimakasih', 'tq': 'terimakasih',
    'prbw': 'prabowo', 'brgizi': 'bergizi'
}


def clean_text_basic(text: str) -> str:
    """Membersihkan teks mentah: case folding, hapus URL/mention/angka/simbol, normalisasi huruf berulang & slang."""
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'@\w+|#\w+', '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'(.)\1{2,}', r'\1', text)
    words = [SLANG_MAP.get(w, w) for w in text.split()]
    return " ".join(words).strip()


def bind_negations_syntactic(text: str) -> str:
    """
    Mengikat kata negasi dengan kata tepat di depannya secara sintaktis (tanpa kamus sentimen),
    misal 'tidak suka' -> 'tidak_suka', 'jangan takut' -> 'jangan_takut'.
    """
    words = str(text).split()
    out = []
    i = 0
    while i < len(words):
        w = words[i]
        if (
            w in NEGATION_WORDS
            and i + 1 < len(words)
            and words[i + 1] not in NEGATION_WORDS
            and words[i + 1] not in NON_NEGATION_FOLLOWERS
        ):
            out.append(f"{w}_{words[i + 1]}")
            i += 2
        else:
            out.append(w)
            i += 1
    return " ".join(out).strip()


def clean_text(text: str) -> str:
    """Pipeline pembersihan teks netral lengkap (tanpa kebocoran kamus sentimen)."""
    return bind_negations_syntactic(clean_text_basic(text))
