import Image from "next/image";
import Link from "next/link";
import { formatWon } from "@/lib/config";
import type { MenuItem } from "@/lib/db/queries";
import type { Store } from "@/lib/stores";
import styles from "./StoreMenu.module.css";

function Thumb({ item }: { item: MenuItem }) {
  if (item.imagePath) {
    return (
      <span className={styles.thumb}>
        <Image src={item.imagePath} alt="" width={72} height={72} sizes="72px" className={styles.thumbImg} />
      </span>
    );
  }
  if (item.hasImageData) {
    return (
      <span className={styles.thumb}>
        {/* DB 이미지는 next/image 대신 일반 img */}
        <img src={`/api/menu-image/${item.id}`} alt="" width={72} height={72} loading="lazy" className={styles.thumbImg} />
      </span>
    );
  }
  return null;
}

function Row({ item }: { item: MenuItem }) {
  return (
    <li className={styles.row}>
      <Thumb item={item} />
      <div className={styles.body}>
        <p className={styles.name}>
          {item.name}
          {item.isGift && <span className={styles.giftMark}>무료 사이드</span>}
        </p>
        {item.description && <p className={styles.desc}>{item.description}</p>}
      </div>
      <span className={`mono ${styles.price}`}>{item.price != null ? formatWon(item.price) : "매장 문의"}</span>
    </li>
  );
}

export function StoreMenu({ store, items, naverUrl }: { store: Store; items: MenuItem[]; naverUrl: string | null }) {
  if (!items.length) {
    return (
      <div className={styles.empty}>
        <p className={`serif ${styles.emptyTitle}`}>메뉴 준비 중</p>
        <p>{store.shortName} 메뉴를 정리하고 있어요. {naverUrl ? "그동안은 네이버 플레이스에서 볼 수 있어요." : ""}</p>
        {naverUrl && <a href={naverUrl} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스 메뉴 ↗</a>}
      </div>
    );
  }
  const gifts = items.filter((m) => m.isGift);
  const rest = items.filter((m) => !m.isGift);
  return (
    <div className={styles.root}>
      {gifts.length > 0 && (
        <section className={styles.giftBox} aria-labelledby="gift-title">
          <header className={styles.giftHead}>
            <h3 id="gift-title" className={`serif ${styles.giftTitle}`}>다른 매장 영수증으로 무료</h3>
            <p className={styles.giftNote}>
              아래 메뉴는 다른 두 매장의 영수증을 인증하면 한 가지를 무료로 드려요. 이 매장 영수증으로는 안 돼요.{" "}
              <Link href="/guide" className={styles.link}>이용 방법</Link>
            </p>
          </header>
          <ul className={styles.list}>
            {gifts.map((m) => <Row key={m.id} item={m} />)}
          </ul>
        </section>
      )}
      {rest.length > 0 && (
        <section aria-label="전체 메뉴">
          {gifts.length > 0 && <p className={`mono ${styles.restLabel}`}>그 밖의 메뉴 · {rest.length}</p>}
          <ul className={styles.list}>
            {rest.map((m) => <Row key={m.id} item={m} />)}
          </ul>
        </section>
      )}
      <p className={styles.foot}>가격은 매장 사정에 따라 바뀔 수 있어요. 무료 사이드 대상 메뉴도 매장에서 조정할 수 있어요.</p>
    </div>
  );
}
