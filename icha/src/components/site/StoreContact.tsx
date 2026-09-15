import { SITE_URL } from "@/lib/config";
import { naverPlaceUrl, type Store } from "@/lib/stores";
import { PhoneIcon, PinIcon } from "@/components/ui/icons";
import styles from "./StoreContact.module.css";

export function StoreContact({ store }: { store: Store }) {
  const map = naverPlaceUrl(store);
  const app = store.naverPlaceId ? `nmap://place?id=${store.naverPlaceId}&appname=${encodeURIComponent(SITE_URL)}` : null;
  const tel = store.phone ? `tel:${store.phone.replace(/[^\d+]/g, "")}` : null;
  return (
    <div className={styles.root}>
      <dl className={styles.list}>
        <div className={styles.item}>
          <dt className={styles.term}><PinIcon size={20} /> 주소</dt>
          <dd className={styles.desc}>
            {store.address ? <span>{store.address}</span> : <span className={styles.muted}>주소 확인 중</span>}
            {store.addressJibun && <span className={`mono ${styles.jibun}`}>지번 {store.addressJibun}</span>}
          </dd>
        </div>
        <div className={styles.item}>
          <dt className={styles.term}><PhoneIcon size={20} /> 전화</dt>
          <dd className={styles.desc}>
            {tel ? (
              <a href={tel} className={`mono ${styles.tel}`}>{store.phone}</a>
            ) : (
              <span className={styles.muted}>전화번호 확인 중</span>
            )}
          </dd>
        </div>
      </dl>
      <div className={styles.actions}>
        {map && (
          <a href={map} target="_blank" rel="noreferrer" className="btn btn-store">
            네이버 지도로 길찾기 ↗
          </a>
        )}
        {app && (
          <a href={app} className={`btn btn-ghost ${styles.appOnly}`}>
            네이버 지도 앱에서 열기
          </a>
        )}
        {tel && (
          <a href={tel} className="btn btn-ghost">
            전화 걸기
          </a>
        )}
      </div>
    </div>
  );
}
