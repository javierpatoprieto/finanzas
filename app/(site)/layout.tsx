import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SidebarToc } from "@/components/SidebarToc";
import { PageLoader } from "@/components/PageLoader";
import { Cursor } from "@/components/Cursor";
import { SmoothScroll } from "@/components/SmoothScroll";
import { GooeyDefs } from "@/components/GooeyDefs";
import { MenuProvider } from "@/components/MenuContext";
import { Menu } from "@/components/Menu";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GooeyDefs />
      <PageLoader />
      <Cursor />
      <MenuProvider>
        <SmoothScroll>
          <Nav />
          <SidebarToc />
          <main>{children}</main>
          <Footer />
        </SmoothScroll>
        <Menu />
      </MenuProvider>
    </>
  );
}
