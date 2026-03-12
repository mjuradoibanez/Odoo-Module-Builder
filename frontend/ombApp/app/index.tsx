import { Redirect } from 'expo-router';
import React from 'react';
import "../global.css";

export const app = () => {
    return (
      <Redirect href="./auth/login" />
    )
}

export default app;