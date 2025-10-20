import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import '../styles/PrivacyPolicy.css'

const PrivacyPolicy = ({ onClose, initialLanguage = 'he' }) => {
  const [language, setLanguage] = useState(initialLanguage)

  return (
    <div className="privacy-policy-modal-overlay" onClick={onClose}>
      <div className="privacy-policy-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with close button and language toggle */}
        <div className="privacy-policy-header">
          <div className="privacy-policy-title">
            {language === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy'}
          </div>
          <div className="privacy-policy-controls">
            <button
              className="language-toggle-btn"
              onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
            >
              {language === 'he' ? 'English' : 'עברית'}
            </button>
            <button className="close-privacy-btn" onClick={onClose}>
              <XMarkIcon width={24} height={24} />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className={`privacy-policy-content ${language === 'he' ? 'rtl' : 'ltr'}`}>
          {language === 'he' ? (
            // HEBREW VERSION
            <>
              <section className="privacy-section">
                <h2>1. מבוא</h2>
                <p>
                  ברוכים הבאים ל-ToDoFast. אנו מתחייבים להגן על פרטיותך וזכויותיך. מדיניות זו מתארת כיצד אנו אוספים, משתמשים,
                  שומרים וחולקים את המידע שלך כאשר אתה משתמש בשירותינו.
                </p>
              </section>

              <section className="privacy-section">
                <h2>2. מידע שאנו אוספים</h2>
                <h3>2.1 מידע שאתה מספק ישירות:</h3>
                <ul>
                  <li><strong>פרטי חשבון:</strong> שם משתמש, כתובת דוא"ל, סיסמה (מוצפנת)</li>
                  <li><strong>מידע פרופיל:</strong> תמונת פרופיל, שם מלא, מידע ביוגרפי</li>
                  <li><strong>תוכן אישי:</strong> משימות, פרויקטים, קומנטים, הערות וכל תוכן אחר שאתה יוצר</li>
                  <li><strong>נתוני קשר:</strong> מספרי טלפון אופציונליים (אם הוזנו)</li>
                </ul>

                <h3>2.2 מידע שנאסף באופן אוטומטי:</h3>
                <ul>
                  <li><strong>נתונים טכניים:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה, זיהוי ההתקן</li>
                  <li><strong>נתוני שימוש:</strong> עמודים שביקרת בהם, זמן שהיית בהם, קישורים שלחצת עליהם</li>
                  <li><strong>Cookies:</strong> אנו משתמשים בעוגיות לשימור פרטי הגישה והעדפות</li>
                  <li><strong>נתוני טוקנים:</strong> אנו שומרים אסימוני הזדהות מוצפנים כדי להשאיר אותך מחובר</li>
                </ul>

                <h3>2.3 מידע משירותים של צד שלישי:</h3>
                <ul>
                  <li><strong>Google Calendar:</strong> אם תחבר את Google Calendar, אנו נשתמש בנתוני לוח השנה שלך</li>
                  <li><strong>Google OAuth:</strong> מידע בסיסי מהחשבון שלך ב-Google (בהסכמתך)</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>3. כיצד אנו משתמשים במידע שלך</h2>
                <ul>
                  <li><strong>לספק שירותים:</strong> יצירה וניהול משימות, פרויקטים, וקבוצות</li>
                  <li><strong>לאימות משתמש:</strong> ולוודא את זהות החשבון שלך בבטחה</li>
                  <li><strong>לשיפור השירות:</strong> ניתוח שימוש, תיקומי באגים, ותוספות תכונות</li>
                  <li><strong>ללשמירת ההיסטוריה:</strong> בדיקת משימות שהושלמו וקבלת אזהרות</li>
                  <li><strong>לתקשורת:</strong> שליחת עדכוני ביטחון, הודעות חשובות, וביקורי דוא"ל</li>
                  <li><strong>לתאימות משפטית:</strong> מענה להוראות משפטיות כאשר נדרש חוקית</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>4. שיתוף מידע</h2>
                <h3>אנו <strong>לא</strong> משתפים את המידע שלך:</h3>
                <ul>
                  <li>עם חברות שלישיות למכירה או מיזמים מסחריים</li>
                  <li>עם מפרסמים לציל כיוונוני ישיר</li>
                  <li>עם כל צד שלישי ללא הסכמתך (פרט לחריגים משפטיים)</li>
                </ul>

                <h3>אנו <strong>עשויים</strong> לשתף:</h3>
                <ul>
                  <li><strong>צוותים וחברים:</strong> בהסכמתך, כאשר אתה משתף משימות או פרויקטים</li>
                  <li><strong>ספקי שירותים:</strong> דיווחים טכניים (מסדי נתונים, שרתים), תחת הסכם חסויות</li>
                  <li><strong>כן נדרש חוקית:</strong> כשמשטרות או גופים משפטיים דורשים זאת</li>
                  <li><strong>בתאונת עסקית:</strong> במקרה של מיזוג או רכישה</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>5. אבטחת המידע</h2>
                <ul>
                  <li>אנו משתמשים בהצפנה SSL/TLS לשמירה על מידע במהלך ההעברה</li>
                  <li>הסיסמאות שלך מוצפנות ולא מאוחסנות בטקסט פשוט</li>
                  <li>גישה למידע מוגבלת לעובדים מורשים בלבד</li>
                  <li>אנו מבצעים עדכונים אבטחה קבועים לתוכנה שלנו</li>
                  <li>למרות מאמצינו, אף מערכת לא בטוחה לחלוטין - השימוש שלך בשירות שלנו הוא בעצם סיכון שלך</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>6. זכויותיך</h2>
                <h3>יש לך את הזכויות הבאות:</h3>
                <ul>
                  <li><strong>זכות גישה:</strong> לבקש העתק של כל המידע שלך</li>
                  <li><strong>זכות תיקון:</strong> לתקן מידע אישי שגוי</li>
                  <li><strong>זכות מחיקה:</strong> לבקש מחיקת המידע שלך (כפוף לחובות משפטיים)</li>
                  <li><strong>זכות למנוע עיבוד:</strong> להפסיק שימוש במידע שלך (פרט לשירותים חיוניים)</li>
                  <li><strong>זכות ניידות:</strong> לקבל את המידע שלך בפורמט נוח</li>
                </ul>
                <p>
                  לתיעוד כל זכות, אנא שלח דוא"ל ל-<strong>privacy@todofast.com</strong> עם הבקשה שלך ויפרטי החשבון.
                </p>
              </section>

              <section className="privacy-section">
                <h2>7. מידע על ילדים</h2>
                <p>
                  השירות שלנו לא מיועד לילדים מתחת לגיל 13. אנו לא אוספים במודע מידע ממשתמשים מתחת לגיל 13.
                  אם אנו מגלים שאספנו מידע מילד מתחת לגיל 13, אנו נמחק את המידע הזה באופן זמין.
                </p>
              </section>

              <section className="privacy-section">
                <h2>8. שמירה על מידע</h2>
                <ul>
                  <li>אנו שומרים על המידע שלך כל עוד החשבון שלך פעיל</li>
                  <li>כאשר אתה מחק חשבון, אנו נמחק את המידע שלך תוך 30 ימים</li>
                  <li>נתוני גיבוי עשויים להישמר קצת יותר זמן (עד 90 ימים) לשיקום אפשרי</li>
                  <li>נתונים שנדרשים לתאימות משפטית שמורים בהתאם לחוק</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>9. Cookies ופעקבוע</h2>
                <p>
                  אנו משתמשים בעוגיות כדי:
                </p>
                <ul>
                  <li>להשאיר אותך מחובר לחשבון שלך</li>
                  <li>זכור את העדפות התצוגה שלך</li>
                  <li>ניתוח השימוש בשירות (Google Analytics)</li>
                  <li>מניעת פעולות זדוניות (CSRF tokens)</li>
                </ul>
                <p>
                  אתה יכול לנהל אם קובלי בדפדפן שלך. הגבלת cookies עשוי להשפיע על פונקציונליות מסוימת של השירות.
                </p>
              </section>

              <section className="privacy-section">
                <h2>10. שיוך משירות צד שלישי</h2>
                <p>
                  כאשר אתה מחבר Google Calendar או משתמש בכניסה ל-Google:
                </p>
                <ul>
                  <li>אנו מקבלים הרשאות מוגבלות בלבד</li>
                  <li>Google וא לא משתפים את סיסמתך</li>
                  <li>אתה יכול להסיר גישה בכל עת דרך הגדרות Google שלך</li>
                  <li>עיין במדיניות הפרטיות של Google כדי להבין כיצד הם מטפלים במידע</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>11. פרוקט משפטי - GDPR ותקנות אחרות</h2>
                <p>
                  אם אתה יושב באיחוד האירופי, אתה מוגן על ידי GDPR. אנו מעמידים את עצמנו בתנאי GDPR,
                  לרבות:
                </p>
                <ul>
                  <li>בקשות SAR (זכות גישה של משתמשים)</li>
                  <li>בקשות DPIA (הערכת השפעה על הגנת הנתונים)</li>
                  <li>עבודה עם מנהל הגנת הנתונים שלך במקרה של הפרה</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>12. הפרות ביטחון</h2>
                <p>
                  אם אנו מגלים הפרה של נתונים, אנו נודיע לך בהקדם האפשרי
                  (בדרך כלל תוך 72 שעות) דרך דוא"ל ופורטל ההודעות שלך.
                </p>
              </section>

              <section className="privacy-section">
                <h2>13. שינויים למדיניות זו</h2>
                <p>
                  אנו עשויים לעדכן מדיניות זו מעת לעת. אנו נודיע לך בדוא"ל או בהודעה על השינויים החשובים.
                  ההמשך בשימוש בשירות אחרי עדכונים יהיה מעיד על הסכמתך לשינויים.
                </p>
              </section>

              <section className="privacy-section">
                <h2>14. יצירת קשר</h2>
                <p>
                  אם יש לך שאלות על מדיניות פרטיות זו, אנא צור קשר:
                </p>
                <div className="contact-info">
                  <p><strong>דוא"ל:</strong> privacy@todofast.com</p>
                  <p><strong>כתובת:</strong> ToDoFast, ישראל</p>
                  <p><strong>טלפון:</strong> +972-50-XXXXXXX (עבור בקשות פרטיות)</p>
                </div>
              </section>

              <section className="privacy-section">
                <h2>15. תאריך כניסה לתוקף</h2>
                <p>
                  מדיניות זו תחלה 1 בינואר 2025. השאר עדכון לעדכוניות עתידיות.
                </p>
              </section>
            </>
          ) : (
            // ENGLISH VERSION
            <>
              <section className="privacy-section">
                <h2>1. Introduction</h2>
                <p>
                  Welcome to ToDoFast. We are committed to protecting your privacy and your rights. This policy describes how we collect, use, store, and share your information when you use our services.
                </p>
              </section>

              <section className="privacy-section">
                <h2>2. Information We Collect</h2>
                <h3>2.1 Information You Provide Directly:</h3>
                <ul>
                  <li><strong>Account Details:</strong> Username, email address, password (encrypted)</li>
                  <li><strong>Profile Information:</strong> Profile picture, full name, biographical information</li>
                  <li><strong>Personal Content:</strong> Tasks, projects, comments, notes, and any other content you create</li>
                  <li><strong>Contact Information:</strong> Optional phone numbers (if provided)</li>
                </ul>

                <h3>2.2 Information Automatically Collected:</h3>
                <ul>
                  <li><strong>Technical Data:</strong> IP address, browser type, operating system, device identifier</li>
                  <li><strong>Usage Data:</strong> Pages you visited, time spent on them, links you clicked</li>
                  <li><strong>Cookies:</strong> We use cookies to remember login details and preferences</li>
                  <li><strong>Token Data:</strong> We store encrypted authentication tokens to keep you logged in</li>
                </ul>

                <h3>2.3 Information from Third-Party Services:</h3>
                <ul>
                  <li><strong>Google Calendar:</strong> If you connect Google Calendar, we use your calendar data</li>
                  <li><strong>Google OAuth:</strong> Basic information from your Google account (with your consent)</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>3. How We Use Your Information</h2>
                <ul>
                  <li><strong>To Provide Services:</strong> Creating and managing tasks, projects, and teams</li>
                  <li><strong>User Authentication:</strong> Verify your account identity securely</li>
                  <li><strong>Service Improvement:</strong> Analyze usage, fix bugs, and add new features</li>
                  <li><strong>History Keeping:</strong> Track completed tasks and send reminders</li>
                  <li><strong>Communication:</strong> Send security updates, important notices, and email notifications</li>
                  <li><strong>Legal Compliance:</strong> Respond to legal requests when required by law</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>4. Information Sharing</h2>
                <h3>We <strong>DO NOT</strong> Share Your Information:</h3>
                <ul>
                  <li>With third-party companies for sale or commercial ventures</li>
                  <li>With advertisers for targeted advertising</li>
                  <li>With any third party without your consent (except for legal exceptions)</li>
                </ul>

                <h3>We <strong>MAY</strong> Share:</h3>
                <ul>
                  <li><strong>Teams and Friends:</strong> With your consent, when you share tasks or projects</li>
                  <li><strong>Service Providers:</strong> Technical reports (databases, servers), under confidentiality agreements</li>
                  <li><strong>Legal Requirements:</strong> When law enforcement or legal authorities require it</li>
                  <li><strong>Business Transition:</strong> In case of merger or acquisition</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>5. Information Security</h2>
                <ul>
                  <li>We use SSL/TLS encryption to protect information during transmission</li>
                  <li>Your passwords are encrypted and not stored in plain text</li>
                  <li>Access to information is limited to authorized employees only</li>
                  <li>We perform regular security updates to our software</li>
                  <li>Despite our efforts, no system is completely secure - your use of our service is at your own risk</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>6. Your Rights</h2>
                <h3>You Have the Following Rights:</h3>
                <ul>
                  <li><strong>Right of Access:</strong> Request a copy of all your information</li>
                  <li><strong>Right to Correction:</strong> Correct inaccurate personal information</li>
                  <li><strong>Right to Deletion:</strong> Request deletion of your information (subject to legal obligations)</li>
                  <li><strong>Right to Object:</strong> Stop us from processing your data (except for essential services)</li>
                  <li><strong>Right to Portability:</strong> Receive your information in a convenient format</li>
                </ul>
                <p>
                  To exercise any of these rights, please send an email to <strong>privacy@todofast.com</strong> with your request and account details.
                </p>
              </section>

              <section className="privacy-section">
                <h2>7. Children's Information</h2>
                <p>
                  Our service is not intended for children under 13. We do not knowingly collect information from users under 13.
                  If we discover that we have collected information from a child under 13, we will delete this information promptly.
                </p>
              </section>

              <section className="privacy-section">
                <h2>8. Information Retention</h2>
                <ul>
                  <li>We retain your information as long as your account is active</li>
                  <li>When you delete an account, we delete your data within 30 days</li>
                  <li>Backup data may be retained slightly longer (up to 90 days) for potential recovery</li>
                  <li>Data required for legal compliance is retained according to applicable law</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>9. Cookies and Tracking</h2>
                <p>
                  We use cookies to:
                </p>
                <ul>
                  <li>Keep you logged into your account</li>
                  <li>Remember your viewing preferences</li>
                  <li>Analyze service usage (Google Analytics)</li>
                  <li>Prevent malicious actions (CSRF tokens)</li>
                </ul>
                <p>
                  You can manage cookies in your browser settings. Limiting cookies may affect some functionality of our service.
                </p>
              </section>

              <section className="privacy-section">
                <h2>10. Third-Party Service Integration</h2>
                <p>
                  When you connect Google Calendar or use Google sign-in:
                </p>
                <ul>
                  <li>We receive limited permissions only</li>
                  <li>Google doesn't share your password with us</li>
                  <li>You can revoke access anytime through your Google settings</li>
                  <li>Review Google's privacy policy to understand how they handle information</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>11. Legal Protection - GDPR and Other Regulations</h2>
                <p>
                  If you are located in the European Union, you are protected by GDPR. We comply with GDPR terms, including:
                </p>
                <ul>
                  <li>SAR requests (Subject Access Requests)</li>
                  <li>DPIA requests (Data Protection Impact Assessment)</li>
                  <li>Working with your data protection officer in case of a breach</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>12. Security Breaches</h2>
                <p>
                  If we discover a data breach, we will notify you as soon as possible
                  (typically within 72 hours) via email and through your notification portal.
                </p>
              </section>

              <section className="privacy-section">
                <h2>13. Changes to This Policy</h2>
                <p>
                  We may update this policy from time to time. We will notify you via email or in-app notification of important changes.
                  Continued use of our service after updates indicates your acceptance of the changes.
                </p>
              </section>

              <section className="privacy-section">
                <h2>14. Contact Us</h2>
                <p>
                  If you have questions about this privacy policy, please contact us:
                </p>
                <div className="contact-info">
                  <p><strong>Email:</strong> privacy@todofast.com</p>
                  <p><strong>Address:</strong> ToDoFast, Israel</p>
                  <p><strong>Phone:</strong> +972-50-XXXXXXX (for privacy requests)</p>
                </div>
              </section>

              <section className="privacy-section">
                <h2>15. Effective Date</h2>
                <p>
                  This policy is effective January 1, 2025. Check back for future updates.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
