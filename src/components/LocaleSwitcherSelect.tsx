"use client";

import { CheckIcon, LanguagesIcon as LanguageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import clsx from "clsx";
import { useTransition } from "react";
import { Locale } from "@/i18n/config";
import { setUserLocale } from "@/services/locale";
import {
  SelectArrow,
  SelectIcon,
  SelectPortal,
  SelectViewport,
} from "@radix-ui/react-select";

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

  function onChange(value: string) {
    const locale = value as Locale;
    startTransition(() => {
      setUserLocale(locale);
    });
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
            "rounded-sm p-2 transition-colors border-none bg-mocha-mousse-50 dark:bg-mocha-mousse-900",
            isPending && "pointer-events-none opacity-60",
          )}
        >
          <SelectIcon>
            <LanguageIcon className="h-6 w-6 dark:text-mocha-mousse-100 dark:bg-mocha-mousse-900 text-mocha-mousse-600 accent-mocha-mousse-700 transition-colors group-hover:text-mocha-mousse-900" />
          </SelectIcon>
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            align="end"
            className="min-w-[8rem] overflow-hidden rounded-sm py-1 shadow-md"
            position="popper"
          >
            <SelectViewport>
              {items.map((item) => (
                <SelectItem
                  key={item.value}
                  className="flex cursor-default items-center px-3 py-2 text-base data-[highlighted]:bg-neutral-100"
                  value={item.value}
                >
                  <div className="mr-2 w-[1rem]">
                    {item.value === defaultValue && (
                      <CheckIcon className="h-5 w-5 text-neutral-800" />
                    )}
                  </div>
                  <span className="dark:text-mocha-mousse-100 text-mocha-mousse-600">
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
