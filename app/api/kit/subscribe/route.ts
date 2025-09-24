import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, name, fields, referrer } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    // 1) Upsert de subscriber com custom fields
    console.log("Received fields:", JSON.stringify(fields, null, 2));

    // Estrutura simples: campos customizados como propriedades diretas
    const subscriberPayload = {
      email_address: email,
      first_name: name || null,
      ...fields, // Spread dos campos customizados diretamente no payload
    };

    console.log(
      "Kit subscriber payload:",
      JSON.stringify(subscriberPayload, null, 2)
    );

    const subRes = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": process.env.KIT_API_KEY!,
      },
      body: JSON.stringify(subscriberPayload),
    });

    if (!subRes.ok) {
      const err = await subRes.text();
      console.error("Kit subscribers error:", err);
      console.error("Kit subscribers status:", subRes.status);
      console.error(
        "Kit subscribers headers:",
        Object.fromEntries(subRes.headers.entries())
      );
      return NextResponse.json(
        { error: `Kit subscribers: ${err}` },
        { status: 500 }
      );
    }

    const subscriberData = await subRes.json();
    console.log(
      "Kit subscriber response:",
      JSON.stringify(subscriberData, null, 2)
    );

    // Se o subscriber já existia, tenta atualizar os campos customizados especificamente
    if (subscriberData.subscriber && subscriberData.subscriber.id) {
      console.log("Subscriber exists, attempting to update custom fields...");

      // Atualiza campos customizados usando a estrutura correta da API
      const updatePayload = {
        fields: fields, // Estrutura correta conforme documentação da API
      };

      console.log(
        "Kit update payload:",
        JSON.stringify(updatePayload, null, 2)
      );

      const updateRes = await fetch(
        `https://api.kit.com/v4/subscribers/${subscriberData.subscriber.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Kit-Api-Key": process.env.KIT_API_KEY!,
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (updateRes.ok) {
        const updateData = await updateRes.json();
        console.log(
          "Kit subscriber update response:",
          JSON.stringify(updateData, null, 2)
        );
      } else {
        const updateErr = await updateRes.text();
        console.warn("Kit subscriber update failed:", updateErr);
      }
    }

    // 2) Adiciona ao Form por email (mais simples)
    const formId = process.env.KIT_FORM_ID!;
    const addFormRes = await fetch(
      `https://api.kit.com/v4/forms/${formId}/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kit-Api-Key": process.env.KIT_API_KEY!,
        },
        body: JSON.stringify({
          email_address: email,
          referrer: referrer || null, // Kit extrai UTM desse referrer
        }),
      }
    );

    if (!addFormRes.ok) {
      const err = await addFormRes.text();
      return NextResponse.json({ error: `Kit forms: ${err}` }, { status: 500 });
    }

    const data = await addFormRes.json();
    return NextResponse.json({ ok: true, kit: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro desconhecido" },
      { status: 500 }
    );
  }
}
