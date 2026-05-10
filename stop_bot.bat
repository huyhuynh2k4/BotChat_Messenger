@echo off

wmic process where "CommandLine like '%%src/index.ts%%'" delete