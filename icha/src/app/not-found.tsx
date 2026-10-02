import { SiteChrome } from "@/components/site/SiteChrome";
import NotFound from "./(site)/not-found";

/**
 * 어느 화면에도 맞지 않는 주소 — 손님 화면과 같은 틀 위에 종이 404. 세션·헤더를 읽지 않아 빌드 때 한 번 만들어 두고(정적) 그대로 내보낸다.
 * (봇이 /wp-admin, /.env 같은 주소를 두드려도 서버 함수가 돌지 않는다.) 손님 화면 안의 notFound() 는 (site)/not-found.tsx 가 받는다.
 */
export default function RootNotFound() {
  return (
    <SiteChrome>
      <NotFound />
    </SiteChrome>
  );
}
