"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Locale, locales } from "@/i18n/config";
import { setUserLocale } from "@/services/locale";
import {
  SelectArrow,
  SelectIcon,
  SelectPortal,
  SelectViewport,
} from "@radix-ui/react-select";
import clsx from "clsx";
import { CheckIcon, LanguagesIcon as LanguageIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

type Props = {
  readonly defaultValue: string;
  readonly items: Array<{ value: string; label: string }>;
  readonly label: string;
};

export default function LocaleSwitcherSelect({
  defaultValue,
  items,
  label,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onChange(value: string) {
    const isLocale = (val: string): val is Locale => {
      const l: readonly string[] = locales;
      return l.includes(val);
    };

    if (isLocale(value)) {
      startTransition(() => {
        setUserLocale(value);
      });
    }
  }

  return (
    <div className="relative">
      <Select
        defaultValue={defaultValue}
        onValueChange={onChange}
        data-testid="localeSwitcher"
      >
        <SelectTrigger
          aria-label={label}
          className={clsx(
            "rounded-sm p-2 transition-colors border-none bg-background dark:bg-muted/50",
            isPending && "pointer-events-none opacity-60",
            pathname === "/" && "bg-transparent!",
          )}
        >
          <SelectIcon>
            <LanguageIcon className="h-6 w-6 dark:text-foreground text-muted-foreground accent-primary transition-colors group-hover:text-primary" />
          </SelectIcon>
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            align="end"
            className="min-w-32 overflow-hidden rounded-sm py-1 shadow-md"
            position="popper"
          >
            <SelectViewport>
              {items.map((item) => (
                <SelectItem
                  key={item.value}
                  className="flex cursor-default items-center px-3 py-2 text-base data-highlighted:bg-neutral-100"
                  value={item.value}
                >
                  <div className="mr-2 w-4">
                    {item.value === defaultValue && (
                      <CheckIcon className="h-5 w-5 text-neutral-800" />
                    )}
                  </div>
                  <span className="dark:text-foreground text-foreground">
                    {item.label}
                  </span>
                </SelectItem>
              ))}
            </SelectViewport>
            <SelectArrow />
          </SelectContent>
        </SelectPortal>
      </Select>
    </div>
  );
}
