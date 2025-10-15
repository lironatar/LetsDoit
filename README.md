# TodoFast - מנהל המשימות המתקדם

![TodoFast Logo](https://img.shields.io/badge/TodoFast-v1.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![Django](https://img.shields.io/badge/Django-5.0+-red.svg)
![Hebrew](https://img.shields.io/badge/Language-עברית-orange.svg)

TodoFast הוא מנהל משימות מתקדם בעברית, הדומה לTodoist, עם תמיכה מלאה ב-RTL ומצב כהה.

## ✨ תכונות עיקריות

### 📋 ניהול משימות
- ✅ יצירה ועריכה של משימות
- 🗂️ ארגון בפרויקטים
- 🏷️ תוויות ומסננים
- ⭐ רמות עדיפות
- 📅 תאריכי יעד ותזמון
- 🔄 משימות חוזרות

### 🎨 עיצוב וחוויית משתמש
- 🌙 מצב כהה ובהיר
- ◀️ תמיכה מלאה ב-RTL ועברית
- 📱 עיצוב רספונסיבי
- ⚡ ממשק מהיר וחלק
- 🎯 עיצוב מינימליסטי ונקי

### 👥 שיתוף פעולה
- 🤝 פרויקטים משותפים
- 👤 הקצאת משימות
- 💬 הערות ותגובות
- 📊 מעקב התקדמות

### 🔧 ניהול מתקדם
- 📈 דוחות ופילטרים
- 🔍 חיפוש מתקדם
- ⚙️ הגדרות אישיות
- 🔒 אבטחה מתקדמת

## 🚀 התקנה והפעלה

### דרישות מערכת
- Python 3.8+
- pip
- git (אופציונלי)

### התקנה מהירה

1. **הורדת הפרויקט**
```bash
# אם יש git
git clone [repository-url]
cd TodoFast2

# או פשוט פתח את התיקייה
```

2. **יצירת סביבה וירטואלית (מומלץ)**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **התקנת חבילות**
```bash
pip install -r requirements.txt
```

4. **הגדרת המערכת**
```bash
python setup.py
```

5. **הפעלת השרת**
```bash
python manage.py runserver
```

6. **גישה לאתר**
   - פתח בדפדפן: `http://127.0.0.1:8000`
   - ממשק ניהול: `http://127.0.0.1:8000/admin`

## 👤 פרטי כניסה

### משתמש הדגמה
- **שם משתמש:** `demo`
- **סיסמה:** `demo123`
- נכלל עם נתוני הדגמה (פרויקטים, משימות, תוויות)

### משתמש מנהל
- **שם משתמש:** `admin`
- **סיסמה:** `admin123`
- גישה לממשק הניהול

## 🎯 איך להשתמש

### יצירת משימה חדשה
1. לחץ על הכפתור "הוסף משימה" 
2. מלא כותרת (חובה)
3. הוסף תיאור (אופציונלי)
4. בחר פרויקט או השאר בתיבת הדואר
5. קבע עדיפות ותאריך יעד
6. לחץ "הוסף משימה"

### יצירת פרויקט
1. לחץ על "+" ליד "הפרויקטים שלי"
2. בחר שם וצבע לפרויקט
3. הוסף תיאור (אופציונלי)
4. לחץ "צור פרויקט"

### ארגון משימות
- **היום** - משימות עם תאריך יעד להיום
- **עתידיות** - משימות עם תאריכי יעד עתידיים
- **תיבת דואר** - משימות ללא פרויקט
- **פרויקטים** - משימות מקובצות לפי נושא

## 🛠️ טכנולוגיות

### Backend
- **Django 5.0** - פריימוורק Python מתקדם
- **SQLite** - מסד נתונים מובנה
- **Django ORM** - ניהול מסד נתונים

### Frontend  
- **HTML5 + CSS3** - מבנה ועיצוב
- **Bootstrap 5.3** - עיצוב רספונסיבי
- **Alpine.js** - אינטראקטיביות
- **Font Awesome** - אייקונים

### תכונות מיוחדות
- **RTL Support** - תמיכה מלאה בכיוון ימין לשמאל
- **Hebrew Fonts** - גופני עברית מותאמים
- **Dark Mode** - מצב כהה עם שמירה מקומית
- **Responsive Design** - תואם לכל המכשירים

## 📁 מבנה הפרויקט

```
TodoFast2/
├── todofast/                 # הגדרות Django עיקריות
│   ├── settings.py          # הגדרות המערכת
│   ├── urls.py             # נתובים עיקריים
│   └── wsgi.py             # הגדרות שרת
├── todo/                    # אפליקציית המשימות
│   ├── models.py           # מודלים (טבלאות)
│   ├── views.py            # לוגיקת עסקים
│   ├── urls.py             # נתובי האפליקציה
│   ├── forms.py            # טפסים
│   └── admin.py            # ממשק ניהול
├── templates/               # תבניות HTML
│   ├── base.html           # תבנית בסיס
│   ├── todo/               # תבניות משימות
│   └── registration/       # תבניות התחברות
├── static/                  # קבצים סטטיים
│   └── css/
│       └── main.css        # עיצוב עיקרי
├── requirements.txt         # חבילות Python
├── setup.py                # סקריפט הגדרה
├── manage.py               # כלי ניהול Django
└── README.md               # הוראות שימוש
```

## 🔧 הגדרות מתקדמות

### שינוי הגדרות בסיס
ערוך את `todofast/settings.py`:
```python
# שפה ואזור זמן
LANGUAGE_CODE = 'he'
TIME_ZONE = 'Asia/Jerusalem'

# מצב DEBUG (כבה בפרודקשן)
DEBUG = True

# מסד נתונים
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### יצירת משתמש מנהל נוסף
```bash
python manage.py createsuperuser
```

### גיבוי מסד נתונים
```bash
python manage.py dumpdata > backup.json
```

### שחזור מסד נתונים
```bash
python manage.py loaddata backup.json
```

## 🐛 פתרון בעיות נפוצות

### השרת לא עולה
```bash
# בדוק שהיקונה הנכונה פעילה
pip install -r requirements.txt

# הרץ מיגרציות
python manage.py migrate

# בדוק שהפורט פנוי
netstat -an | findstr :8000
```

### בעיות עם קבצים סטטיים
```bash
python manage.py collectstatic --clear
```

### איפוס מסד נתונים
```bash
del db.sqlite3
python manage.py migrate
python setup.py
```

## 🚀 פיתוח ותרומה

### הוספת תכונות חדשות
1. צור branch חדש
2. פתח את המודלים ב-`todo/models.py`
3. הוסף views ב-`todo/views.py`
4. צור תבניות ב-`templates/todo/`
5. עדכן נתובים ב-`todo/urls.py`

### הרצת בדיקות
```bash
python manage.py test
```

## 📞 תמיכה ועזרה

### שאלות נפוצות
- **איך לשנות סיסמה?** עבור להגדרות > שינוי סיסמה
- **איך למחוק פרויקט?** לחץ על ההגדרות בפרויקט > מחק פרויקט
- **איך לייבא משימות?** השתמש בממשק הניהול

### דיווח על בעיות
אם נתקלת בבעיה:
1. בדוק את הקובץ `README.md`
2. חפש בקטע "פתרון בעיות"
3. פתח issue בגיטהאב

## 📄 רישיון

פרויקט זה מפותח לצרכי הדגמה וחינוך.

## 🙏 תודות

תודה למפתחי:
- Django - פריימוורק מעולה
- Bootstrap - עיצוב מהיר
- Alpine.js - אינטראקטיביות פשוטה
- Font Awesome - אייקונים יפים

---

**TodoFast** - כי משימות צריכות להיות פשוטות ומהירות! ⚡

*פותח בישראל 🇮🇱 עם הרבה ❤️*
