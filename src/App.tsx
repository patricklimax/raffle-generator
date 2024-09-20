import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useState } from "react";

const raffleSchema = z.object({
  raffleName: z.string().min(1, "Nome da rifa é obrigatório"),
  ticketCount: z.number().min(1, "É necessário gerar pelo menos 1 rifa"),
  includeTicketNumber: z.boolean(),
  description: z.string().min(1, "Descrição é obrigatória"),
  prize: z.string().min(1, "Insira pelo menos um prêmio"),
  price: z.number().min(1, "Valor da rifa é obrigatório"),
  location: z.string().min(1, "Local do sorteio é obrigatório"),
  drawDate: z.string().min(1, "Data do sorteio é obrigatória"),
  drawTime: z.string().min(1, "Hora do sorteio é obrigatória"),
  observations: z.string().optional(),
  prizeImages: z.any().optional(),
});

type RaffleFormData = z.infer<typeof raffleSchema>;

export default function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RaffleFormData>({
    resolver: zodResolver(raffleSchema),
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews([reader.result as string]);
        setValue("prizeImages", [reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const generatePDF = (data: RaffleFormData) => {
    const doc = new jsPDF("portrait", "pt", "a4");
    const ticketsPerPage = 6;
    const ticketHeight = 120;
    let positionYinitial = 70;
    const pageWidth = doc.internal.pageSize.width / 2;

    for (let i = 0; i < data.ticketCount; i++) {
      // Canhoto para o vendedor
      doc.setDrawColor(0);

      doc.setLineWidth(0.5);

      doc.rect(20, positionYinitial - 10, 240, ticketHeight - 10);

      doc
        .setFontSize(12)
        .text(`Controle Vendedor`, pageWidth - 160, positionYinitial + 5, {
          align: "center",
        });

      doc
        .setFontSize(12)
        .text(`${data.raffleName}`, pageWidth - 160, positionYinitial + 20, {
          align: "center",
        });

      doc
        .setFontSize(9)
        .text(
          "Comprador: _______________________________",
          30,
          positionYinitial + 35
        );

      doc
        .setFontSize(9)
        .text(
          "Telefone: _________________________________",
          30,
          positionYinitial + 50
        );

      doc
        .setFontSize(9)
        .text(
          `Data: ${formatDate(data.drawDate)}, às ${data.drawTime}h`,
          30,
          positionYinitial + 65
        );

      if (data.includeTicketNumber) {
        doc
          .setFontSize(9)
          .text(`Número do Sorteio: ${i + 1}`, 30, positionYinitial + 80);
      }

      // Para o comprador
      doc.rect(270, positionYinitial - 10, 310, ticketHeight - 10);

      doc
        .setFontSize(12)
        .text(`${data.raffleName}`, pageWidth + 130, positionYinitial + 5, {
          align: "center",
        });

      if (data.includeTicketNumber) {
        doc
          .setFontSize(12)
          .text(`Nº ${i + 1}`, pageWidth + 240, positionYinitial + 10);
      }

      doc
        .setFontSize(9)
        .text(`Por apenas`, pageWidth + 67, positionYinitial + 30, {
          align: "center",
        });

      doc
        .setFontSize(20)
        .text(
          `R$ ${data.price.toFixed(2)}`,
          pageWidth + 140,
          positionYinitial + 34,
          {
            align: "center",
          }
        );

      doc
        .setFontSize(6)
        .text(
          `VOCÊ CONCORRERÁ A UM EXCELENTE PRÊMIO`,
          pageWidth + 130,
          positionYinitial + 45,
          {
            align: "center",
          }
        );

      doc
        .setFontSize(10)
        .text(`Prêmio: ${data.prize}`, pageWidth + 130, positionYinitial + 60, {
          align: "center",
        });

      doc
        .setFontSize(7)
        .text(`${data.description}`, pageWidth + 130, positionYinitial + 72, {
          align: "center",
        });

      doc
        .setFontSize(9)
        .text(
          `Data: ${formatDate(data.drawDate)}, às ${data.drawTime}h, Local: ${
            data.location
          }`,
          pageWidth + 130,
          positionYinitial + 85,
          {
            align: "center",
          }
        );

      doc
        .setFontSize(7)
        .text("Deus abençõe você!", pageWidth + 240, positionYinitial + 95, {
          align: "center",
        });

      doc
        .setFontSize(6)
        .text(
          `Obs.: ${data.observations}`,
          pageWidth - 20,
          positionYinitial + 95
        );

      if (imagePreviews.length > 0) {
        doc.addImage(
          imagePreviews[0],
          "JPEG",
          pageWidth - 15,
          positionYinitial + 15,
          50,
          50
        );
      }

      positionYinitial += ticketHeight;

      // Adiciona nova página
      if ((i + 1) % ticketsPerPage === 0 && i + 1 < data.ticketCount) {
        doc.addPage();
        positionYinitial = 70;
      }
    }

    doc.save(`${data.raffleName}_cartelas.pdf`);
  };

  return (
    <main className="max-w-5xl mx-auto  min-h-screen">
      <h1 className="text-4xl py-4 text-center font-semibold uppercase">
        Gerador de Tickets de Rifa
      </h1>
      <form
        onSubmit={handleSubmit(generatePDF)}
        className="px-8 pt-10 flex flex-col gap-4"
      >
        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Nome da Rifa</label>
            <input
              placeholder="Ex.: Rifa dos Amigos da Rua Dois"
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              {...register("raffleName")}
            />
            {errors.raffleName && <p>{errors.raffleName.message}</p>}
          </div>
          <div className="flex flex-col w-60">
            <label className="text-sm  ml-1">Quantidade de Rifas</label>
            <input
              placeholder="Ex.: 150"
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              type="number"
              {...register("ticketCount", { valueAsNumber: true })}
            />
            {errors.ticketCount && <p>{errors.ticketCount.message}</p>}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Breve descrição da rifa</label>
            <input
              placeholder="Ex.: Rifa para arrecadar fundos para publicação do meu livro"
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              {...register("description")}
            />
            {errors.description && <p>{errors.description.message}</p>}
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Prêmio</label>
            <input
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              {...register("prize")}
              placeholder="Ex.: Uma bicicleta preta e branco"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Valor da Rifa</label>
            <input
              placeholder="Ex.: 10,00"
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              type="number"
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && <p>{errors.price.message}</p>}
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Local do Sorteio</label>
            <input
              placeholder="Minha casa, via rede social"
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              {...register("location")}
            />
            {errors.location && <p>{errors.location.message}</p>}
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Data do Sorteio</label>
            <input
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              type="date"
              {...register("drawDate")}
            />
            {errors.drawDate && <p>{errors.drawDate.message}</p>}
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm  ml-1">Hora do Sorteio</label>
            <input
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              type="time"
              {...register("drawTime")}
            />
            {errors.drawTime && <p>{errors.drawTime.message}</p>}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm  ml-1">Observações</label>
          <input
            type="text"
            placeholder="Ex.: O resultado do sorteio será publicado no aplicativo de mensagem"
            className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
            {...register("observations")}
          />
        </div>

        <div className="flex gap-10 items-center">
          <div className="flex flex-col">
            <label className="text-sm  ml-1">Imagem do Prêmio</label>
            <input
              className="bg-transparent border border-slate-300 outline-none rounded-md px-4 py-2"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <div className="w-36 h-36 border border-slate-300 flex items-center justify-center">
            {imagePreviews.length <= 0 && (
              <p className="text-center">Sua Imagem aparecerá aqui...</p>
            )}
            {imagePreviews.length > 0 &&
              imagePreviews.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Prêmio ${index + 1}`}
                  width="100"
                  height="100"
                  className="my-4"
                />
              ))}
          </div>
        </div>

        <div className="border border-slate-300 flex-1 rounded-md p-4 flex gap-10 items-center justify-center mt-4">
          <div className="flex items-center justify-center">
            <input
              className="bg-transparent accent-emerald-600 border border-slate-300 outline-none rounded-md px-4 py-2"
              type="checkbox"
              {...register("includeTicketNumber")}
            />
            <label className="text-sm ml-1">Incluir Número da Rifa</label>
          </div>
          <button
            type="submit"
            className="bg-emerald-800 px-4 py-2 text-white font-semibold rounded-md transition-all duration-500 ease-out hover:bg-emerald-900 uppercase text-sm"
          >
            Imprimir Rifas
          </button>
        </div>
      </form>
    </main>
  );
}
