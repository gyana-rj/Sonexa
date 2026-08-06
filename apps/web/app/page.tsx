import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { Appbar } from "./components/Appbar";

export default function Home() {
  return (
    <div className={styles.page}>
      <Appbar />
    </div>
  );
}
