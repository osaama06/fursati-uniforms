'use client'
import "@/styles/pages/contact-us.css";

import { useState } from "react";



export default function ContactForm() {
const [form, setForm] = useState({ name: "", email: "", message: "" });
const [sent, setSent] = useState(false);


const handleChange = (e) => {
setForm({ ...form, [e.target.name]: e.target.value });
};


const handleSubmit = (e) => {
e.preventDefault();
setSent(true);
};


return (
<div className="contact-container" dir="rtl">
<h1 className="contact-title">تواصل معنا</h1>


{sent ? (
<div className="success-message">تم إرسال رسالتك بنجاح. شكرًا لتواصلك!</div>
) : (
<form className="contact-form" onSubmit={handleSubmit}>
<label>الاسم</label>
<input
type="text"
name="name"
value={form.name}
onChange={handleChange}
required
/>


<label>البريد الإلكتروني</label>
<input
type="email"
name="email"
value={form.email}
onChange={handleChange}
required
/>


<label>الرسالة</label>
<textarea
name="message"
value={form.message}
onChange={handleChange}
rows="5"
required
></textarea>


<button type="submit" className="submit-btn">إرسال</button>
</form>
)}
</div>
);
}