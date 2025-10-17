"use client";

import React from "react";
import {initMixpanel} from "@/lib/mixpanelClient";

interface Props {
    children: React.ReactNode;
}

export default function MixpanelLayout({children}: Props) {
    React.useEffect(() => {
        initMixpanel();
    }, []);

    return (
        <>{children}</>
    );
}