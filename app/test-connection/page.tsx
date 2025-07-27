"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, Database, Loader2 } from "lucide-react"

export default function TestConnectionPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runConnectionTest = async () => {
    setIsLoading(true)
    setTestResults(null)

    try {
      const response = await fetch("/api/test-connection", {
        method: "POST",
      })

      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      setTestResults({
        success: false,
        error: "Error al ejecutar las pruebas: " + error.message,
        tests: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnóstico de Conexión</h1>
          <p className="text-gray-600">Verifica la conexión a la base de datos Neon</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Prueba de Conexión a Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runConnectionTest}
              disabled={isLoading}
              className="bg-lime-400 hover:bg-lime-500 text-black font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando Pruebas...
                </>
              ) : (
                "Ejecutar Diagnóstico"
              )}
            </Button>
          </CardContent>
        </Card>

        {testResults && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Resultado General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={testResults.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {testResults.success ? "CONEXIÓN EXITOSA" : "CONEXIÓN FALLIDA"}
                </Badge>
                {testResults.error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-red-700 font-medium">Error:</p>
                    <p className="text-red-600 text-sm mt-1">{testResults.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {testResults.tests &&
              testResults.tests.map((test: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {test.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {test.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge className={test.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {test.success ? "PASÓ" : "FALLÓ"}
                      </Badge>
                      <p className="text-sm text-gray-600">{test.description}</p>
                      {test.result && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                          <strong>Resultado:</strong> {JSON.stringify(test.result, null, 2)}
                        </div>
                      )}
                      {test.error && (
                        <div className="mt-2 p-3 bg-red-50 rounded text-sm">
                          <strong className="text-red-700">Error:</strong>
                          <pre className="text-red-600 mt-1 whitespace-pre-wrap">{test.error}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {testResults.environment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Variables de Entorno
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(testResults.environment).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{key}:</span>
                        <Badge className={value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {value ? "DEFINIDA" : "NO DEFINIDA"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
