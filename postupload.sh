#!/usr/bin/env bash

echo Extracting files. . .
tar -xf aquaponic.tar
echo Done

node /node_app_slot/main.js
