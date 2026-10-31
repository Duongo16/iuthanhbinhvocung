FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/CuteDatingScheduler.Api/CuteDatingScheduler.Api.csproj backend/CuteDatingScheduler.Api/
RUN dotnet restore backend/CuteDatingScheduler.Api/CuteDatingScheduler.Api.csproj
COPY backend/CuteDatingScheduler.Api/ backend/CuteDatingScheduler.Api/
RUN dotnet publish backend/CuteDatingScheduler.Api/CuteDatingScheduler.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "CuteDatingScheduler.Api.dll"]
