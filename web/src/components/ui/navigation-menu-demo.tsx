import * as React from "react";
import { Link } from "wouter";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function NavigationMenuDemo() {
  const products = [
    {
      title: "Paint Protection Film (PPF)",
      href: "/products/ppf",
      description: "Virtually invisible urethane film that protects vehicle paint from stone chips, bug stains, and minor abrasions."
    },
    {
      title: "Automotive Ceramic Coating",
      href: "/products/automotive-coating",
      description: "Liquid polymer that creates a permanent bond with vehicle paint, providing superior protection and shine."
    },
    {
      title: "Home Series Ceramic Coating",
      href: "/products/home-coating",
      description: "Advanced protection for kitchen countertops, bathroom surfaces, glass, and more with long-lasting hydrophobic properties."
    }
  ];

  const partners = [
    {
      title: "Distributors",
      href: "/partners/distributors",
      description: "Join our network of authorized distributors and grow your business with premium protection products."
    },
    {
      title: "Installers",
      href: "/partners/installers",
      description: "Become a certified P91 installer and offer your customers the best protection solutions available."
    }
  ];

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link href="/p91-pulse">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              P91 Pulse
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link href="/about">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              About Us
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {products.map((product) => (
                <ListItem
                  key={product.title}
                  title={product.title}
                  href={product.href}
                >
                  {product.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link href="/store">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Flagship Store
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger>Partners</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
              {partners.map((partner) => (
                <ListItem
                  key={partner.title}
                  title={partner.title}
                  href={partner.href}
                >
                  {partner.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link href="/warranty">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              eWarranty
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link href="/contact">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Contact
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

interface ListItemProps {
  title: string;
  href: string;
  children?: React.ReactNode;
}

const ListItem = ({ title, href, children }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
            <div className="text-sm font-header font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
ListItem.displayName = "ListItem";
