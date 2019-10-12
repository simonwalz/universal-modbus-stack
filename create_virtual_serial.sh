#!/bin/bash

socat -d -d \
	pty,raw,echo=0,link=./virtual-serial-in \
	pty,raw,echo=0,link=./virtual-serial-out

