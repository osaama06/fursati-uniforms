

// components/Navbar.js
'use client';
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      const filtered = data.filter(cat => cat.count > 0);
      setCategories(filtered);
    }

    fetchCategories();
  }, []);

  return (
    <nav style={styles.nav}>
      <ul style={styles.navList}>
        {categories.map((cat) => (
          <li key={cat.id} style={styles.navItem}>
            <Link href={`/${cat.slug}`} style={styles.navLink}>{cat.name}</Link>
          </li>



        ))}
      </ul>
    </nav>
  );
}



const styles = {
    nav: {
        background: "#251f35",
        // padding: '10px',
        alignItems :'center',
        height:'2.5rem'
    },

    navList: {
        overflow: 'auto',
        scrollbarWidth: 'none',
        height:'100%',
        listStyle: 'none',
        display: 'flex',
        justifyContent: 'space-around',
        margin: 0,
        padding: 0,
        alignItems :'center'

    },
    navItem: {
        color: '#fff',
        margin: '0 4px 0 4px'
        // margin: '0 10px',
    },
    navLink: {
        color: '#fff',
        textDecoration: 'none',
        fontSize: '16px',
    },
};


